import Link from "next/link";
import Flash from "@/components/ui/Flash";
import PageHeader from "@/components/ui/PageHeader";
import GlowButton from "@/components/ui/GlowButton";
import GlowCard from "@/components/ui/GlowCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, toLocalInputValue } from "@/lib/utils";
import { rescheduleSession } from "@/modules/planner/actions";

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

interface DeadlineRow {
  id: string;
  title: string;
  due_at: string;
  courses: { title: string } | null;
}

// Method icon helper
function getMethodIcon(methodName?: string) {
  const name = methodName?.toLowerCase() || "";
  if (name.includes("pomodoro")) return "⏱";
  if (name.includes("feynman")) return "💡";
  if (name.includes("spaced") || name.includes("repetition")) return "🔁";
  if (name.includes("active") || name.includes("recall")) return "🧠";
  if (name.includes("sq3r")) return "📖";
  return "⚡";
}

// Study Planner overview: weekly day strip, session cards with method icon & colored edge,
// missed session recovery animation, and quick planning actions
export default async function PlannerHome({
  searchParams,
}: {
  searchParams: { msg?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date();

  // Load user sessions
  const { data: sessionData } = await supabase
    .from("study_sessions")
    .select("id,title,planned_start,planned_minutes,status,actual_minutes,assignment_id,courses(title),study_methods(name)")
    .eq("student_id", user!.id)
    .order("planned_start", { ascending: true })
    .limit(200);

  const sessions = (sessionData ?? []) as unknown as SessionRow[];

  const endOf = (s: SessionRow) => new Date(s.planned_start).getTime() + s.planned_minutes * 60000;
  const planned = sessions.filter((s) => s.status === "planned");
  const upcoming = planned.filter((s) => endOf(s) >= now.getTime());
  const missed = planned.filter((s) => endOf(s) < now.getTime());
  const finished = sessions
    .filter((s) => s.status === "completed" || s.status === "partial")
    .reverse()
    .slice(0, 5);

  // Load assignments not submitted yet
  const { data: deadlineData } = await supabase
    .from("assignments")
    .select("id,title,due_at,courses(title)")
    .gte("due_at", now.toISOString())
    .order("due_at", { ascending: true })
    .limit(10);

  const { data: submitted } = await supabase
    .from("submissions")
    .select("assignment_id")
    .eq("student_id", user!.id);
  const submittedIds = new Set((submitted ?? []).map((s) => s.assignment_id));
  const deadlines = ((deadlineData ?? []) as unknown as DeadlineRow[]).filter(
    (d) => !submittedIds.has(d.id)
  );

  const tomorrow = new Date(now.getTime() + 86400000);

  // Generate 7-day weekly strip
  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    const isToday = i === 0;
    return { date: d, dayName, dayNum, isToday };
  });

  return (
    <div className="space-y-8 animate-fade-in-up">
      <PageHeader
        title="Study Planner"
        subtitle="Intelligent scheduling, spaced repetition, and missed session recovery."
        action={
          <div className="flex items-center gap-3">
            <Link href="/student/planner/methods">
              <button className="btn-ghost">Study Methods</button>
            </Link>
            <Link href="/student/planner/new">
              <GlowButton variant="accent" size="sm">
                + Plan a session
              </GlowButton>
            </Link>
          </div>
        }
      />

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {/* Weekly Day Strip */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          This Week&apos;s Focus Rhythm
        </p>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-2.5 sm:p-3 text-center transition ${
                day.isToday
                  ? "border-primary bg-primary-subtle text-primary shadow-sm"
                  : "border-border bg-surface-2 text-muted"
              }`}
            >
              <p className="text-[11px] font-bold uppercase">{day.dayName}</p>
              <p className="font-serif text-lg font-bold text-main mt-0.5">{day.dayNum}</p>
              <div className="mt-1 flex justify-center">
                <span className={`h-1.5 w-1.5 rounded-full ${day.isToday ? "bg-primary" : "bg-border"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missed Sessions Recovery Card (with Attention Animation) */}
      {missed.length > 0 && (
        <section className="rounded-2xl border border-danger/40 bg-danger-subtle/30 p-6 shadow-sm space-y-4 animate-pulse-glow">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-danger animate-ping" />
            <h2 className="font-serif text-xl font-bold text-danger">
              Missed Sessions ({missed.length}) — Recovery Needed
            </h2>
          </div>
          <p className="text-sm text-muted">
            These planned sessions elapsed without being logged. Reschedule with one click to keep your study momentum unbroken.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {missed.map((s) => (
              <div key={s.id} className="card space-y-3 border-danger/30">
                <div>
                  <h3 className="font-semibold text-main">{s.title}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Was scheduled for {formatDateTime(s.planned_start)} &middot; {s.planned_minutes} min
                  </p>
                </div>
                <form action={rescheduleSession} className="space-y-2">
                  <input type="hidden" name="id" value={s.id} />
                  <label className="block text-xs font-medium text-muted">
                    Reschedule to:
                    <input
                      name="planned_start"
                      type="datetime-local"
                      defaultValue={toLocalInputValue(tomorrow)}
                      required
                      className="input mt-1"
                    />
                  </label>
                  <GlowButton variant="traffic" size="sm" className="w-full">
                    Reschedule Session
                  </GlowButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Sessions Grid */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-main">
          Upcoming Scheduled Sessions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((s) => {
            const methodIcon = getMethodIcon(s.study_methods?.name);
            return (
              <Link key={s.id} href={`/student/planner/sessions/${s.id}`} className="block group">
                <GlowCard className="h-full border-l-4 border-l-primary hover:border-primary/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted mb-2">
                      <span className="flex items-center gap-1.5 font-semibold text-primary">
                        <span>{methodIcon}</span>
                        <span>{s.study_methods?.name ?? "Independent Study"}</span>
                      </span>
                      <StatusBadge status={s.status} size="sm" />
                    </div>

                    <h3 className="font-serif text-lg font-bold text-main group-hover:text-primary transition line-clamp-2">
                      {s.title}
                    </h3>

                    {s.courses?.title && (
                      <p className="text-xs text-muted mt-1">{s.courses.title}</p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
                    <span>⏱ {s.planned_minutes} mins</span>
                    <span className="font-semibold text-primary">Start Room &rarr;</span>
                  </div>
                </GlowCard>
              </Link>
            );
          })}

          {upcoming.length === 0 && (
            <div className="col-span-full card text-center py-10">
              <p className="text-muted">No sessions currently scheduled on your planner.</p>
              <Link href="/student/planner/new" className="inline-block mt-3">
                <GlowButton variant="accent" size="sm">
                  Plan a new study session
                </GlowButton>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Deadlines to Plan Section */}
      {deadlines.length > 0 && (
        <section className="card space-y-4 border-accent/20">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-main">
              Assignments to Plan For
            </h2>
            <Link href="/student/assignments" className="text-xs font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {deadlines.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-3.5"
              >
                <div>
                  <h3 className="font-semibold text-sm text-main">{d.title}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {d.courses?.title} &middot; Due {formatDateTime(d.due_at)}
                  </p>
                </div>
                <Link href={`/student/planner/new?assignment=${d.id}`}>
                  <GlowButton variant="accent" size="sm">
                    Plan
                  </GlowButton>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Finished Sessions Archive */}
      {finished.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-serif text-lg font-bold text-main">
            Recently Finished Focus Blocks
          </h2>
          <div className="space-y-2">
            {finished.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2/60 p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-success font-bold">✓</span>
                  <span className="font-semibold text-main">{s.title}</span>
                </div>
                <div className="flex items-center gap-3 text-muted">
                  <span>{s.actual_minutes ?? s.planned_minutes} min logged</span>
                  <StatusBadge status={s.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
