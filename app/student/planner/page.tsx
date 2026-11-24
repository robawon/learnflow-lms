import Link from "next/link";
import Flash from "@/components/ui/Flash";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, formatDateTime, toLocalInputValue } from "@/lib/utils";
import { markMissed, rescheduleSession } from "@/modules/planner/actions";

// One study session row with its course and method names, as returned by the query below.
interface SessionRow {
  id: string;
  title: string;
  planned_start: string;
  planned_minutes: number;
  status: string;
  actual_minutes: number | null;
  assignment_id: string | null;
  courses: { title: string } | null;
  study_methods: { name: string } | null;
}

// One upcoming assignment with its course title.
interface DeadlineRow {
  id: string;
  title: string;
  due_at: string;
  courses: { title: string } | null;
}

// Study Planner overview. It connects the LMS to planning:
//  - upcoming assignment deadlines, each with a "Plan study" button,
//  - missed sessions that need rescheduling (missed-session recovery),
//  - upcoming planned sessions and recently finished ones.
export default async function PlannerHome({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date();

  // All of the student's sessions (oldest first).
  const { data: sessionData } = await supabase
    .from("study_sessions")
    .select("id,title,planned_start,planned_minutes,status,actual_minutes,assignment_id,courses(title),study_methods(name)")
    .eq("student_id", user!.id)
    .order("planned_start", { ascending: true })
    .limit(200);
  const sessions = (sessionData ?? []) as unknown as SessionRow[];

  // A planned session counts as missed once its end time has passed.
  const endOf = (s: SessionRow) => new Date(s.planned_start).getTime() + s.planned_minutes * 60000;
  const planned = sessions.filter((s) => s.status === "planned");
  const upcoming = planned.filter((s) => endOf(s) >= now.getTime());
  const missed = planned.filter((s) => endOf(s) < now.getTime());
  const finished = sessions.filter((s) => s.status === "completed" || s.status === "partial").reverse().slice(0, 5);

  // Upcoming assignments the student has not submitted yet.
  const { data: deadlineData } = await supabase
    .from("assignments")
    .select("id,title,due_at,courses(title)")
    .gte("due_at", now.toISOString())
    .order("due_at", { ascending: true })
    .limit(10);
  const { data: submitted } = await supabase.from("submissions").select("assignment_id").eq("student_id", user!.id);
  const submittedIds = new Set((submitted ?? []).map((s) => s.assignment_id));
  const deadlines = ((deadlineData ?? []) as unknown as DeadlineRow[]).filter((d) => !submittedIds.has(d.id));
  const plannedAssignmentIds = new Set(
    sessions.filter((s) => s.assignment_id && ["planned", "completed", "partial"].includes(s.status)).map((s) => s.assignment_id)
  );

  // Default time for rescheduling: tomorrow at the same time.
  const tomorrow = new Date(now.getTime() + 86400000);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Study Planner"
        subtitle="Turn your deadlines into study sessions."
        action={<Link href="/student/planner/new" className="btn">Plan a session</Link>}
      />
      <Flash msg={searchParams.msg} error={searchParams.error} />

      {/* Missed sessions: recovery */}
      {missed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Missed sessions ({missed.length})</h2>
          <p className="text-sm text-slate-500">These sessions passed without being finished. Pick a new time, or mark them as missed.</p>
          {missed.map((s) => (
            <div key={s.id} className="card space-y-3 border-amber-200">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-slate-500">Was planned for {formatDateTime(s.planned_start)} &middot; {s.planned_minutes} min</p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <form action={rescheduleSession} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={s.id} />
                  <label className="text-sm font-medium">New time
                    <input name="planned_start" type="datetime-local" defaultValue={toLocalInputValue(tomorrow)} required className="input mt-1" />
                  </label>
                  <button className="btn">Reschedule</button>
                </form>
                <form action={markMissed}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="btn-ghost">Mark as missed</button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Deadlines from the LMS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming deadlines</h2>
        {deadlines.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-water-600">{d.courses?.title}</p>
              <p className="font-medium">{d.title}</p>
              <p className="text-sm text-slate-500">Due {formatDateTime(d.due_at)} &middot; {daysBetween(now, new Date(d.due_at))} days left</p>
            </div>
            {plannedAssignmentIds.has(d.id) ? (
              <span className="badge bg-emerald-100 text-emerald-800">Study time planned</span>
            ) : (
              <Link href={`/student/planner/new?assignment=${d.id}`} className="btn">Plan study</Link>
            )}
          </div>
        ))}
        {deadlines.length === 0 && <p className="text-sm text-slate-500">No open deadlines. Assignments from your courses appear here.</p>}
      </section>

      {/* Upcoming sessions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming sessions</h2>
        {upcoming.map((s) => (
          <Link key={s.id} href={`/student/planner/sessions/${s.id}`} className="card flex items-center justify-between transition hover:border-water-300">
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-slate-500">
                {formatDateTime(s.planned_start)} &middot; {s.planned_minutes} min
                {s.study_methods?.name && <> &middot; {s.study_methods.name}</>}
              </p>
            </div>
            <StatusBadge status={s.status} />
          </Link>
        ))}
        {upcoming.length === 0 && <p className="text-sm text-slate-500">Nothing planned. Choose a deadline above or plan a session.</p>}
      </section>

      {/* Recently finished */}
      {finished.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recently finished</h2>
          {finished.map((s) => (
            <Link key={s.id} href={`/student/planner/sessions/${s.id}`} className="card flex items-center justify-between transition hover:border-water-300">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-slate-500">{formatDateTime(s.planned_start)} &middot; studied {s.actual_minutes ?? 0} of {s.planned_minutes} min</p>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
