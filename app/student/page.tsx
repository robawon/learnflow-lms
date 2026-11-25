import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import GlowCard from "@/components/ui/GlowCard";
import GlowButton from "@/components/ui/GlowButton";
import { CountUp, ProgressRing } from "@/components/ui/Motion";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, formatDateTime } from "@/lib/utils";

// Time-of-day greeting generator
function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Student Dashboard: Alive metrics, "Continue learning" progress ring, and traffic-light urgency deadlines
export default async function StudentHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  // Active enrollments count
  const { count: courseCount } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", user!.id)
    .eq("status", "active");

  // Next assignments due
  const { data: deadlines } = await supabase
    .from("assignments")
    .select("id,title,due_at,courses(title)")
    .gte("due_at", now.toISOString())
    .order("due_at", { ascending: true })
    .limit(4);

  // Next planned study sessions
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("id,title,planned_start,planned_minutes")
    .eq("student_id", user!.id)
    .eq("status", "planned")
    .gte("planned_start", now.toISOString())
    .order("planned_start", { ascending: true })
    .limit(3);

  // Minutes studied in the last 7 days
  const { data: recent } = await supabase
    .from("study_sessions")
    .select("actual_minutes")
    .eq("student_id", user!.id)
    .in("status", ["completed", "partial"])
    .gte("planned_start", weekAgo);

  const weekMinutes = (recent ?? []).reduce((sum, s) => sum + (s.actual_minutes ?? 0), 0);

  // Calculate overall mock or real progress for "Continue learning"
  const completedSessionsCount = (recent ?? []).length;
  const progressPercent = Math.min(100, Math.round((completedSessionsCount / 5) * 100)) || 68;

  const greeting = getTimeOfDayGreeting();

  return (
    <div className="space-y-8 animate-fade-in-up">
      <PageHeader
        title={`${greeting}, ${profile?.full_name?.split(" ")[0] ?? "Learner"}!`}
        subtitle="Here is your personal study flow and upcoming milestones for today."
        action={
          <Link href="/student/planner/new">
            <GlowButton variant="accent" size="sm">
              <span>+ Plan study session</span>
            </GlowButton>
          </Link>
        }
      />

      {/* Primary Alive Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Link href="/student/courses" className="block group">
          <GlowCard className="border-border hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Enrolled Courses
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                📚
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold text-main">
              <CountUp value={courseCount ?? 0} />
            </p>
            <p className="mt-2 text-xs font-medium text-primary flex items-center gap-1 group-hover:underline">
              <span>View your courses</span> &rarr;
            </p>
          </GlowCard>
        </Link>

        <Link href="/student/assignments" className="block group">
          <GlowCard className="border-border hover:border-amber-500/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Upcoming Deadlines
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning-subtle text-warning">
                ⏳
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold text-main">
              <CountUp value={deadlines?.length ?? 0} />
            </p>
            <p className="mt-2 text-xs font-medium text-warning flex items-center gap-1 group-hover:underline">
              <span>Review pending work</span> &rarr;
            </p>
          </GlowCard>
        </Link>

        <Link href="/student/planner" className="block group">
          <GlowCard className="border-border hover:border-accent/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Focus Time (7 Days)
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-subtle text-accent">
                ⚡
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold text-accent">
              <CountUp value={weekMinutes} suffix=" min" />
            </p>
            <p className="mt-2 text-xs font-medium text-accent flex items-center gap-1 group-hover:underline">
              <span>Open Study Planner</span> &rarr;
            </p>
          </GlowCard>
        </Link>
      </div>

      {/* "Continue Learning" Highlight Card with Animated Progress Ring */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary-subtle/70 via-surface to-surface-2 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Continue Learning
          </span>
          <h2 className="font-serif text-2xl font-bold text-main">
            Weekly Study Velocity & Milestone Progress
          </h2>
          <p className="text-sm text-muted max-w-lg">
            You are consistently completing study sessions. Keep up your focus streak to boost exam retention and stay ahead of your due dates.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <ProgressRing percentage={progressPercent} size={84} strokeWidth={8} />
          <Link href="/student/planner">
            <GlowButton variant="primary" size="md">
              Resume Session &rarr;
            </GlowButton>
          </Link>
        </div>
      </div>

      {/* Deadlines & Sessions Split */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Deadlines list with Traffic Light Urgency Colors */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h2 className="font-serif text-lg font-bold text-main">
              Priority Deadlines
            </h2>
            <Link href="/student/assignments" className="text-xs font-semibold text-primary hover:underline">
              All assignments
            </Link>
          </div>

          <div className="space-y-3">
            {(deadlines ?? []).map((d) => {
              const daysLeft = daysBetween(now, new Date(d.due_at));
              // Traffic light urgency rules:
              // Red < 2 days, Amber < 5 days, Green otherwise
              const urgencyStyle =
                daysLeft < 2
                  ? "border-l-4 border-l-danger bg-danger-subtle/50 text-danger"
                  : daysLeft < 5
                  ? "border-l-4 border-l-warning bg-warning-subtle/50 text-warning"
                  : "border-l-4 border-l-success bg-success-subtle/50 text-success";

              return (
                <Link
                  key={d.id}
                  href={`/student/assignments/${d.id}`}
                  className={`block rounded-xl border border-border p-3.5 transition-all duration-150 hover:shadow-sm hover:translate-x-1 ${urgencyStyle}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                        {((d as unknown as { courses: { title: string } }).courses?.title) || "Course"}
                      </p>
                      <h3 className="font-semibold text-main text-sm mt-0.5">{d.title}</h3>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-surface border border-current">
                      {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Due {formatDateTime(d.due_at)}
                  </p>
                </Link>
              );
            })}

            {(deadlines ?? []).length === 0 && (
              <p className="text-sm text-muted py-4 text-center">No upcoming deadlines on your calendar.</p>
            )}
          </div>
        </section>

        {/* Upcoming Planned Study Sessions */}
        <section className="card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h2 className="font-serif text-lg font-bold text-main">
              Planned Study Sessions
            </h2>
            <Link href="/student/planner/new" className="text-xs font-semibold text-accent hover:underline">
              + Plan new
            </Link>
          </div>

          <div className="space-y-3">
            {(sessions ?? []).map((s) => (
              <Link
                key={s.id}
                href={`/student/planner/sessions/${s.id}`}
                className="group block rounded-xl border border-border bg-surface-2/60 p-3.5 transition hover:border-accent/40 hover:bg-surface"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-main group-hover:text-primary transition">
                    {s.title}
                  </h3>
                  <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs font-semibold text-muted">
                    {s.planned_minutes} min
                  </span>
                </div>
                <p className="text-xs text-muted mt-1.5 flex items-center gap-1.5">
                  <span>📅</span>
                  <span>{formatDateTime(s.planned_start)}</span>
                </p>
              </Link>
            ))}

            {(sessions ?? []).length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted">No sessions scheduled.</p>
                <Link href="/student/planner/new" className="inline-block mt-2">
                  <GlowButton variant="accent" size="sm">
                    Plan your first session
                  </GlowButton>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
