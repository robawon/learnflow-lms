import Link from "next/link";
import Image from "next/image";
import PublicNav from "@/components/ui/PublicNav";
import GlowButton from "@/components/ui/GlowButton";
import GlowCard from "@/components/ui/GlowCard";
import { CountUp } from "@/components/ui/Motion";

// Curated platform features
const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Modular Courses & Lessons",
    text: "Follow rich structured curricula with downloadable attachments, live progress tracking, and interactive milestone completions.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Assignments & Feedback",
    text: "Submit assignments directly with drag-and-drop file upload, receive real-time instructor evaluations, and review graded rubric criteria.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Intelligent Study Planner",
    text: "Transform rigid deadlines into manageable, scientifically backed study sessions using spaced repetition and Pomodoro blocks with missed-session recovery.",
  },
];

// 3-Step workflow
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enroll in curated courses",
    description: "Browse high-impact courses taught by experienced instructors and join with one click.",
  },
  {
    step: "02",
    title: "Automate your study rhythm",
    description: "The AI study planner maps out your target study sessions right up to assignment deadlines.",
  },
  {
    step: "03",
    title: "Execute & track mastery",
    description: "Use the live focus timer room, review materials side-by-side, and celebrate finished milestones.",
  },
];

// Public Home page matching Reference 1 (LinkedIn Learning) + Reference 2 (Alive modern palette)
export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-main selection:bg-primary/20">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden mesh-gradient-hero border-b border-border/60 pb-20 pt-12 lg:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            {/* Left Column: Confident headline with bold keywords and dual pill CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Adaptive Learning & Intelligent Planning
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-main leading-[1.12]">
                Develop <span className="text-primary underline decoration-accent/30 decoration-wavy underline-offset-8">critical skills</span> that move your{" "}
                <span className="font-extrabold text-accent">academic career forward</span>.
              </h1>

              <p className="max-w-xl text-lg text-muted leading-relaxed">
                Connect your curriculum, assignments, and study sessions in one unified platform.
                Never fall behind on a deadline with automated session recovery and spaced focus intervals.
              </p>

              {/* Dual pill button call to action */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/register">
                  <GlowButton variant="primary" size="lg">
                    <span>Start learning free</span>
                    <span aria-hidden="true">&rarr;</span>
                  </GlowButton>
                </Link>
                <Link
                  href="/courses"
                  className="rounded-full border border-border bg-surface px-6 py-3.5 text-base font-semibold text-main transition hover:border-primary/50 hover:bg-surface-2 active:scale-95"
                >
                  Explore Catalog
                </Link>
              </div>

              {/* Social trust badge */}
              <div className="flex items-center gap-4 pt-4 text-xs text-muted">
                <div className="flex -space-x-2">
                  <span className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-primary/20 text-center font-bold leading-8 text-primary">JD</span>
                  <span className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-accent/20 text-center font-bold leading-8 text-accent">SK</span>
                  <span className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-warning/20 text-center font-bold leading-8 text-warning">AR</span>
                  <span className="inline-block h-8 w-8 rounded-full ring-2 ring-surface bg-success/20 text-center font-bold leading-8 text-success">+</span>
                </div>
                <span>Over <strong>10,000+</strong> study sessions successfully completed</span>
              </div>
            </div>

            {/* Right Column: Large Circular Cropped Student Photo + Floating Cards */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glowing ring backdrop */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary/30 via-accent/25 to-warning/30 blur-2xl opacity-60" />

                {/* Circular image container */}
                <div className="relative h-80 w-80 sm:h-96 sm:w-96 rounded-full p-2.5 bg-gradient-to-tr from-primary via-accent to-amber-500 shadow-2xl">
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-surface-2">
                    <Image
                      src="/images/students-hero.jpg"
                      alt="Student studying with focus"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Floating dynamic widgets around the circular photo */}
                <div className="absolute -top-3 -left-6 rounded-2xl border border-border bg-surface/95 p-3.5 shadow-xl backdrop-blur-md animate-float-slow">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-subtle text-success">
                      ✓
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-muted">Lesson Done</p>
                      <p className="text-xs font-bold text-main">React Fundamentals</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 rounded-2xl border border-border bg-surface/95 p-4 shadow-xl backdrop-blur-md animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-subtle text-primary font-bold">
                      ⏱
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted">Focus Session</p>
                      <p className="text-xs font-bold text-main">45 min Pomodoro</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -right-8 -translate-y-1/2 rounded-full border border-border bg-surface/95 px-4 py-2 shadow-lg backdrop-blur-md">
                  <span className="text-xs font-bold text-accent">★ 98% Mastery</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Live Count-Up Stats Strip */}
      <section className="border-b border-border bg-surface py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center">
            <div className="p-4">
              <p className="font-serif text-3xl sm:text-4xl font-extrabold text-primary">
                <CountUp value={99} suffix="%" />
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted">On-time assignment completion</p>
            </div>
            <div className="p-4">
              <p className="font-serif text-3xl sm:text-4xl font-extrabold text-accent">
                <CountUp value={250} suffix="+" />
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted">Active video & reading lessons</p>
            </div>
            <div className="p-4">
              <p className="font-serif text-3xl sm:text-4xl font-extrabold text-success">
                <CountUp value={4} duration={800} suffix="x" />
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted">Higher study retention</p>
            </div>
            <div className="p-4">
              <p className="font-serif text-3xl sm:text-4xl font-extrabold text-warning">
                <CountUp value={12500} suffix="+" />
              </p>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted">Study minutes logged</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-main">
              Everything you need to master your studies
            </h2>
            <p className="mt-3 text-base text-muted">
              Built with purpose for students who want high achievement without burning out.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <GlowCard key={f.title} glowColor={i === 0 ? "blue" : i === 1 ? "brown" : "subtle"}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 border border-border">
                  {f.icon}
                </div>
                <h3 className="font-serif text-xl font-bold text-main">{f.title}</h3>
                <p className="mt-2.5 text-sm text-muted leading-relaxed">{f.text}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works 3-Step Strip */}
      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-main">
              How LearnFlow Works
            </h2>
            <p className="mt-2 text-sm text-muted">
              Three simple steps to transform your academic workflow.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {HOW_IT_WORKS.map((item, idx) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-border bg-surface-2/60 p-8 text-left transition hover:border-primary/40"
              >
                <span className="font-serif text-3xl font-extrabold text-primary/40">
                  {item.step}
                </span>
                <h3 className="mt-3 font-serif text-lg font-bold text-main">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link href="/register">
              <GlowButton variant="accent" size="lg">
                Join LearnFlow Today &rarr;
              </GlowButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-10 text-center text-xs text-muted">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LearnFlow Learning Management & Study Planner. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/courses" className="hover:text-main">Courses</Link>
            <Link href="/login" className="hover:text-main">Sign In</Link>
            <Link href="/register" className="hover:text-main">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
