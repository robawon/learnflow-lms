import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Assignment, Submission } from "@/lib/types";
import { gradeSubmission } from "@/modules/lms/actions/assignments";

// A submission together with the student's name, as returned by the query below.
type SubmissionWithStudent = Submission & { profiles: { full_name: string } | null };

// Grading page for one assignment: shows each submission (text, file, time, late or not)
// and a form to enter a score and feedback.
export default async function GradeAssignment({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { msg?: string; error?: string };
}) {
  const supabase = createClient();

  const { data: assignmentData } = await supabase.from("assignments").select("*").eq("id", params.id).single();
  if (!assignmentData) notFound();
  const assignment = assignmentData as Assignment;

  const { data } = await supabase
    .from("submissions")
    .select("*, profiles(full_name)")
    .eq("assignment_id", params.id)
    .order("submitted_at", { ascending: false });

  // Adds a temporary download link (valid for 1 hour) to each submission that has a file.
  const submissions = await Promise.all(
    ((data ?? []) as unknown as SubmissionWithStudent[]).map(async (s) => {
      if (!s.file_path) return { ...s, url: null as string | null };
      const { data: signed } = await supabase.storage.from("submissions").createSignedUrl(s.file_path, 3600);
      return { ...s, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <Link href={`/instructor/courses/${assignment.course_id}/assignments`} className="text-sm font-medium text-water-700">
        &larr; Back to assignments
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{assignment.title}</h1>
        <p className="text-sm text-slate-500">Due {formatDateTime(assignment.due_at)} &middot; max {assignment.max_score ?? 100} points</p>
      </div>

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {submissions.map((s) => {
        const late = new Date(s.submitted_at) > new Date(assignment.due_at);
        return (
          <div key={s.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-medium">{s.profiles?.full_name ?? "Unknown student"}</h2>
              <p className="text-xs text-slate-500">
                Submitted {formatDateTime(s.submitted_at)}
                {late && <span className="badge ml-2 bg-red-100 text-red-700">Late</span>}
              </p>
            </div>
            {s.text_answer && <p className="whitespace-pre-wrap rounded-lg bg-water-50 p-3 text-sm">{s.text_answer}</p>}
            {s.url && <a href={s.url} target="_blank" className="text-sm font-medium text-water-700">Download submitted file</a>}

            <form action={gradeSubmission} className="flex flex-wrap items-end gap-2 border-t border-water-100 pt-3">
              <input type="hidden" name="assignment_id" value={assignment.id} />
              <input type="hidden" name="submission_id" value={s.id} />
              <label className="text-sm font-medium">Score
                <input name="score" type="number" step="0.5" min={0} max={assignment.max_score ?? 100}
                  defaultValue={s.score ?? ""} className="input mt-1 w-28" />
              </label>
              <label className="min-w-[200px] flex-1 text-sm font-medium">Feedback
                <input name="feedback" defaultValue={s.feedback ?? ""} className="input mt-1" />
              </label>
              <button className="btn">{s.score === null ? "Save grade" : "Update grade"}</button>
            </form>
          </div>
        );
      })}
      {submissions.length === 0 && <p className="text-slate-500">No submissions yet.</p>}
    </div>
  );
}
