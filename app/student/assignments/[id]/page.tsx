import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Assignment, Submission } from "@/lib/types";
import { submitAssignment } from "@/modules/lms/actions/assignments";

// Student view of one assignment: instructions, due date, a "plan study" link to the planner,
// the submit form (when allowed), and the student's previous submissions with grade and feedback.
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

  // If the student is not enrolled in the course, row-level security returns nothing.
  const { data } = await supabase.from("assignments").select("*, courses(title)").eq("id", params.id).single();
  if (!data) notFound();
  const assignment = data as unknown as Assignment & { courses: { title: string } | null };

  const { data: subData } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", params.id)
    .eq("student_id", user!.id)
    .order("submitted_at", { ascending: false });

  // Adds a temporary download link (valid for 1 hour) to each submission that has a file.
  const submissions = await Promise.all(
    ((subData ?? []) as Submission[]).map(async (s) => {
      if (!s.file_path) return { ...s, url: null as string | null };
      const { data: signed } = await supabase.storage.from("submissions").createSignedUrl(s.file_path, 3600);
      return { ...s, url: signed?.signedUrl ?? null };
    })
  );

  // A student can submit if they have not submitted yet, or if resubmission is allowed.
  const canSubmit = submissions.length === 0 || !!assignment.allow_resubmit;
  const overdue = new Date(assignment.due_at) < new Date();

  return (
    <div className="space-y-6">
      <Link href="/student/assignments" className="text-sm font-medium text-water-700">&larr; All assignments</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-water-600">{assignment.courses?.title}</p>
          <h1 className="text-2xl font-semibold">{assignment.title}</h1>
          <p className="text-sm text-slate-500">
            Due {formatDateTime(assignment.due_at)} &middot; {assignment.max_score ?? 100} points
            {overdue && <span className="badge ml-2 bg-red-100 text-red-700">Past due</span>}
          </p>
        </div>
        <Link href={`/student/planner/new?assignment=${assignment.id}`} className="btn-ghost">Plan study time</Link>
      </div>

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {assignment.instructions && (
        <div className="card"><h2 className="font-semibold">Instructions</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm">{assignment.instructions}</p></div>
      )}

      {/* Submit form */}
      {canSubmit ? (
        <form action={submitAssignment} className="card space-y-3">
          <h2 className="font-semibold">{submissions.length ? "Submit a new version" : "Your submission"}</h2>
          <input type="hidden" name="assignment_id" value={assignment.id} />
          <textarea name="text_answer" rows={5} placeholder="Type your answer (optional if you attach a file)" className="input" />
          <input name="file" type="file" className="text-sm" />
          <button className="btn">Submit</button>
          {overdue && <p className="text-xs text-red-600">This is past the due date, so it will be marked late.</p>}
        </form>
      ) : (
        <p className="text-sm text-slate-600">You have submitted this assignment. Resubmission is not allowed.</p>
      )}

      {/* Previous submissions */}
      {submissions.map((s) => (
        <div key={s.id} className="card space-y-2">
          <p className="text-xs text-slate-500">
            Submitted {formatDateTime(s.submitted_at)}
            {new Date(s.submitted_at) > new Date(assignment.due_at) && <span className="badge ml-2 bg-red-100 text-red-700">Late</span>}
          </p>
          {s.text_answer && <p className="whitespace-pre-wrap rounded-lg bg-water-50 p-3 text-sm">{s.text_answer}</p>}
          {s.url && <a href={s.url} target="_blank" className="text-sm font-medium text-water-700">Your uploaded file</a>}
          {s.score !== null ? (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm">
              <p className="font-medium">Grade: {s.score} / {assignment.max_score ?? 100}</p>
              {s.feedback && <p className="mt-1">Feedback: {s.feedback}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Waiting for grading.</p>
          )}
        </div>
      ))}
    </div>
  );
}
