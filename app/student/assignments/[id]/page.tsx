import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import GlowButton from "@/components/ui/GlowButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Assignment, Submission } from "@/lib/types";
import { submitAssignment } from "@/modules/lms/actions/assignments";

// Student view of one assignment: instructions, due date, timeline, drag & drop submission zone
export default async function StudentAssignment({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { msg?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("assignments")
    .select("*, courses(title)")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const assignment = data as unknown as Assignment & { courses: { title: string } | null };

  const { data: subData } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", params.id)
    .eq("student_id", user!.id)
    .order("submitted_at", { ascending: false });

  const submissions = await Promise.all(
    ((subData ?? []) as Submission[]).map(async (s) => {
      if (!s.file_path) return { ...s, url: null as string | null };
      const { data: signed } = await supabase.storage.from("submissions").createSignedUrl(s.file_path, 3600);
      return { ...s, url: signed?.signedUrl ?? null };
    })
  );

  const canSubmit = submissions.length === 0 || !!assignment.allow_resubmit;
  const overdue = new Date(assignment.due_at) < new Date();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href="/student/assignments"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-main"
      >
        &larr; Back to all assignments
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {assignment.courses?.title}
          </p>
          <h1 className="font-serif text-3xl font-bold text-main mt-1">
            {assignment.title}
          </h1>
          <p className="text-sm text-muted mt-1.5 flex items-center gap-2">
            <span>Due {formatDateTime(assignment.due_at)}</span>
            <span>&middot;</span>
            <span>{assignment.max_score ?? 100} points</span>
            {overdue && <StatusBadge status="overdue" size="sm" />}
          </p>
        </div>

        <Link href={`/student/planner/new?assignment=${assignment.id}`}>
          <GlowButton variant="accent" size="sm">
            <span>+ Plan study for this</span>
          </GlowButton>
        </Link>
      </div>

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {/* Assignment Instructions */}
      {assignment.instructions && (
        <section className="card space-y-3">
          <h2 className="font-serif text-xl font-bold text-main">Instructions</h2>
          <p className="whitespace-pre-wrap text-sm text-muted leading-relaxed">
            {assignment.instructions}
          </p>
        </section>
      )}

      {/* Submission Zone */}
      {canSubmit ? (
        <form action={submitAssignment} className="card space-y-5 border-primary/20">
          <div>
            <h2 className="font-serif text-xl font-bold text-main">
              {submissions.length ? "Submit a Revised Version" : "Submit Your Work"}
            </h2>
            <p className="text-xs text-muted mt-1">
              Provide written answers or attach documents.
            </p>
          </div>

          <input type="hidden" name="assignment_id" value={assignment.id} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Written response / notes
            </label>
            <textarea
              name="text_answer"
              rows={5}
              placeholder="Type your answer, reflections or notes here..."
              className="input"
            />
          </div>

          {/* Drag and Drop Styled File Upload Container */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Attach files (PDF, ZIP, DOCX)
            </label>
            <div className="relative rounded-2xl border-2 border-dashed border-border p-6 text-center transition hover:border-primary/50 bg-surface-2/40">
              <svg className="mx-auto h-10 w-10 text-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-main font-medium">
                Choose file or drag and drop here
              </p>
              <p className="text-xs text-muted mt-1">Up to 25MB supported</p>
              <input
                name="file"
                type="file"
                className="mt-4 block w-full text-xs text-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary-subtle file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2">
            <GlowButton variant="traffic" size="md">
              <span>Submit Assignment</span>
              <span aria-hidden="true">&rarr;</span>
            </GlowButton>
          </div>

          {overdue && (
            <p className="text-xs text-danger font-medium">
              Note: The due date has passed. Your submission will be recorded with a late timestamp.
            </p>
          )}
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-2 p-5 text-sm text-muted">
          You have already submitted this assignment. Resubmissions are not permitted for this task.
        </div>
      )}

      {/* Submission Timeline / History */}
      {submissions.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-main">Submission Timeline</h2>
          <div className="space-y-3">
            {submissions.map((s, index) => {
              const isLate = new Date(s.submitted_at) > new Date(assignment.due_at);
              return (
                <div key={s.id} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Version #{submissions.length - index}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDateTime(s.submitted_at)}
                      {isLate && <span className="ml-2 font-bold text-danger">[Late]</span>}
                    </span>
                  </div>

                  {s.text_answer && (
                    <div className="rounded-xl bg-surface-2 p-4 text-sm text-main whitespace-pre-wrap">
                      {s.text_answer}
                    </div>
                  )}

                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>📎 Download submitted file</span> &rarr;
                    </a>
                  )}

                  {s.score !== null ? (
                    <div className="rounded-xl border border-success/30 bg-success-subtle p-4 text-sm text-success">
                      <p className="font-bold text-base">
                        Grade: {s.score} / {assignment.max_score ?? 100}
                      </p>
                      {s.feedback && <p className="mt-1 text-main">Feedback: {s.feedback}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">Awaiting grading from your instructor.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
