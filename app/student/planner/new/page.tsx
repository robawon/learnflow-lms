import Flash from "@/components/ui/Flash";
import PageHeader from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, toLocalInputValue } from "@/lib/utils";
import { createSession } from "@/modules/planner/actions";

// One enrollment with its course, used to list the student's courses.
interface EnrolledRow {
  courses: { id: string; title: string } | null;
}

// One assignment with its course title, used to list upcoming deadlines.
interface AssignmentRow {
  id: string;
  title: string;
  due_at: string;
  courses: { title: string } | null;
}

// "Plan a session" page. The student chooses what they are studying (an assignment deadline
// or a whole course), a time and a length, and how confident they feel. By default the planner
// picks the study method; the student can also choose one manually.
export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: { assignment?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date();

  const { data: enrolled } = await supabase
    .from("enrollments")
    .select("courses(id,title)")
    .eq("student_id", user!.id)
    .eq("status", "active");
  const courses = ((enrolled ?? []) as unknown as EnrolledRow[]).flatMap((e) => (e.courses ? [e.courses] : []));

  const { data: assignmentData } = await supabase
    .from("assignments")
    .select("id,title,due_at,courses(title)")
    .gte("due_at", now.toISOString())
    .order("due_at", { ascending: true });
  const assignments = (assignmentData ?? []) as unknown as AssignmentRow[];

  const { data: methods } = await supabase.from("study_methods").select("id,name").order("name");

  // Default start: tomorrow at 18:00.
  const start = new Date(now.getTime() + 86400000);
  start.setHours(18, 0, 0, 0);

  const preselected = searchParams.assignment ? `a:${searchParams.assignment}` : "";

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Plan a study session" subtitle="Pick what you study and when. The planner suggests how." />
      <Flash error={searchParams.error} />

      <form action={createSession} className="card space-y-4">
        <label className="block text-sm font-medium">What are you studying?
          <select name="target" required defaultValue={preselected} className="input mt-1">
            <option value="" disabled>Choose an assignment or a course</option>
            {assignments.length > 0 && (
              <optgroup label="Assignments due">
                {assignments.map((a) => (
                  <option key={a.id} value={`a:${a.id}`}>
                    {a.courses?.title}: {a.title} (due {formatDateTime(a.due_at)})
                  </option>
                ))}
              </optgroup>
            )}
            {courses.length > 0 && (
              <optgroup label="Courses">
                {courses.map((c) => <option key={c.id} value={`c:${c.id}`}>{c.title}</option>)}
              </optgroup>
            )}
          </select>
        </label>

        <label className="block text-sm font-medium">Session title
          <input name="title" required placeholder="e.g. Revise chapter 3" className="input mt-1" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">Start
            <input name="planned_start" type="datetime-local" required defaultValue={toLocalInputValue(start)} className="input mt-1" />
          </label>
          <label className="block text-sm font-medium">Length (minutes)
            <input name="planned_minutes" type="number" min={10} step={5} defaultValue={60} required className="input mt-1" />
          </label>
        </div>

        <label className="block text-sm font-medium">How confident do you feel about this topic? (1 = not at all, 5 = very)
          <input name="confidence" type="range" min={1} max={5} defaultValue={3} className="mt-1 w-full accent-water-600" />
        </label>

        <label className="block text-sm font-medium">Study method
          <select name="method_id" defaultValue="auto" className="input mt-1">
            <option value="auto">Let the planner choose (recommended)</option>
            {(methods ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>

        <button className="btn">Plan session</button>
      </form>
    </div>
  );
}
