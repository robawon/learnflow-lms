import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { createAssignment, deleteAssignment } from "@/modules/lms/actions/assignments";

// One assignment with the number of submissions it has received (from the embedded count).
interface AssignmentRow {
  id: string;
  title: string;
  due_at: string;
  max_score: number | null;
  submissions: { count: number }[];
}

// Instructor page for a course's assignments: lists them with their due dates and submission counts,
// and shows a form to create a new assignment.
export default async function CourseAssignments({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { msg?: string; error?: string };
}) {
  const supabase = createClient();

  const { data: course } = await supabase.from("courses").select("id,title").eq("id", params.id).single();
  if (!course) notFound();

  const { data } = await supabase
    .from("assignments")
    .select("id,title,due_at,max_score,submissions(count)")
    .eq("course_id", params.id)
    .order("due_at", { ascending: true });
  const assignments = (data ?? []) as unknown as AssignmentRow[];

  return (
    <div className="space-y-6">
      <Link href={`/instructor/courses/${course.id}`} className="text-sm font-medium text-water-700">&larr; Back to {course.title}</Link>
      <h1 className="text-2xl font-semibold">Assignments</h1>

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {/* Existing assignments */}
      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium">{a.title}</h2>
              <p className="text-sm text-slate-500">Due {formatDateTime(a.due_at)} &middot; max {a.max_score ?? 100} points</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/instructor/assignments/${a.id}`} className="btn-ghost">
                Submissions ({a.submissions?.[0]?.count ?? 0})
              </Link>
              <form action={deleteAssignment}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <button className="btn-danger">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-slate-500">No assignments yet.</p>}
      </div>

      {/* New assignment form */}
      <form action={createAssignment} className="card max-w-2xl space-y-3">
        <h2 className="font-semibold">New assignment</h2>
        <input type="hidden" name="course_id" value={course.id} />
        <input name="title" placeholder="Title" required className="input" />
        <textarea name="instructions" rows={4} placeholder="Instructions" className="input" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">Due date and time
            <input name="due_at" type="datetime-local" required className="input mt-1" />
          </label>
          <label className="block text-sm font-medium">Maximum score
            <input name="max_score" type="number" min={1} defaultValue={100} className="input mt-1" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="allow_resubmit" type="checkbox" /> Allow students to resubmit
        </label>
        <button className="btn">Create assignment</button>
      </form>
    </div>
  );
}
