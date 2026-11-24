import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

// One assignment with its course title, as returned by the query below.
interface AssignmentRow {
  id: string;
  title: string;
  due_at: string;
  max_score: number | null;
  courses: { title: string } | null;
}

// Works out an assignment's status for the student: graded, submitted, overdue or pending.
function statusOf(dueAt: string, submission?: { score: number | null }) {
  if (submission) return submission.score !== null ? "graded" : "submitted";
  return new Date(dueAt) < new Date() ? "overdue" : "pending";
}

// Student assignments page: lists every assignment from the student's courses,
// soonest due date first, with a status badge and the score once graded.
export default async function StudentAssignments() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Row-level security only returns assignments from courses the student is enrolled in.
  const { data } = await supabase
    .from("assignments")
    .select("id,title,due_at,max_score,courses(title)")
    .order("due_at", { ascending: true });
  const assignments = (data ?? []) as unknown as AssignmentRow[];

  // Keeps the latest submission per assignment (rows come oldest first, so later ones overwrite).
  const { data: subs } = await supabase
    .from("submissions")
    .select("assignment_id,score,submitted_at")
    .eq("student_id", user!.id)
    .order("submitted_at", { ascending: true });
  const latest = new Map((subs ?? []).map((s) => [s.assignment_id, s]));

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" subtitle="Everything due in your courses." />
      <div className="space-y-3">
        {assignments.map((a) => {
          const sub = latest.get(a.id);
          const status = statusOf(a.due_at, sub);
          return (
            <Link key={a.id} href={`/student/assignments/${a.id}`} className="card flex items-center justify-between transition hover:border-water-300">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-water-600">{a.courses?.title}</p>
                <h2 className="font-medium">{a.title}</h2>
                <p className="text-sm text-slate-500">Due {formatDateTime(a.due_at)}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={status} />
                {sub?.score != null && <p className="mt-1 text-sm">{sub.score} / {a.max_score ?? 100}</p>}
              </div>
            </Link>
          );
        })}
        {assignments.length === 0 && <p className="text-slate-500">No assignments yet. They appear here when you enroll in a course that has some.</p>}
      </div>
    </div>
  );
}
