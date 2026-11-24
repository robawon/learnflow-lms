import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, formatDateTime } from "@/lib/utils";

// Student dashboard. Greets the student by name and summarises their courses,
// next deadlines, upcoming study sessions and study time this week.
export default async function StudentHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

  // Counts the student's active enrollments.
  const { count: courseCount } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user!.id)
    .eq("status", "active");

  // The next few assignments due (row-level security only returns the student's own courses).
  const { data: deadlines } = await supabase
    .from("assignments")
    .select("id,title,due_at,courses(title)")
    .gte("due_at", now.toISOString())
    .order("due_at", { ascending: true })
    .limit(3);

  // The next planned study sessions.
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("id,title,planned_start,planned_minutes")
    .eq("student_id", user!.id)
    .eq("status", "planned")
    .gte("planned_start", now.toISOString())
    .order("planned_start", { ascending: true })
    .limit(3);

  // Minutes studied in the last 7 days.
  const { data: recent } = await supabase
    .from("study_sessions")
    .select("actual_minutes")
    .eq("student_id", user!.id)
    .in("status", ["completed", "partial"])
    .gte("planned_start", weekAgo);
  const weekMinutes = (recent ?? []).reduce((sum, s) => sum + (s.actual_minutes ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${profile?.full_name ?? ""}`} subtitle="Here is your learning at a glance." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/student/courses" className="card transition hover:border-water-300">
          <p className="text-sm text-slate-500">My courses</p>
          <p className="mt-1 text-3xl font-semibold text-water-700">{courseCount ?? 0}</p>
        </Link>
        <Link href="/student/assignments" className="card transition hover:border-water-300">
          <p className="text-sm text-slate-500">Assignments due soon</p>
          <p className="mt-1 text-3xl font-semibold text-water-700">{deadlines?.length ?? 0}</p>
        </Link>
        <Link href="/student/planner" className="card transition hover:border-water-300">
          <p className="text-sm text-slate-500">Minutes studied this week</p>
          <p className="mt-1 text-3xl font-semibold text-water-700">{weekMinutes}</p>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="font-semibold">Next deadlines</h2>
          {(deadlines ?? []).map((d) => (
            <Link key={d.id} href={`/student/assignments/${d.id}`} className="block rounded-lg bg-water-50 px-3 py-2 text-sm hover:bg-water-100">
              <p className="font-medium">{d.title}</p>
              <p className="text-slate-500">
                {formatDateTime(d.due_at)} &middot; {daysBetween(now, new Date(d.due_at))} days left
              </p>
            </Link>
          ))}
          {(deadlines ?? []).length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
        </section>

        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upcoming study sessions</h2>
            <Link href="/student/planner/new" className="text-sm font-medium text-water-700">Plan one</Link>
          </div>
          {(sessions ?? []).map((s) => (
            <Link key={s.id} href={`/student/planner/sessions/${s.id}`} className="block rounded-lg bg-water-50 px-3 py-2 text-sm hover:bg-water-100">
              <p className="font-medium">{s.title}</p>
              <p className="text-slate-500">{formatDateTime(s.planned_start)} &middot; {s.planned_minutes} min</p>
            </Link>
          ))}
          {(sessions ?? []).length === 0 && <p className="text-sm text-slate-500">Nothing planned yet.</p>}
        </section>
      </div>
    </div>
  );
}
