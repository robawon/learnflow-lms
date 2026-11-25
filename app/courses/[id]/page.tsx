import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import PublicNav from "@/components/ui/PublicNav";
import GlowButton from "@/components/ui/GlowButton";
import { createClient } from "@/lib/supabase/server";
import { enrollInCourse } from "@/modules/lms/actions/enrollment";

// Course Details: banner header, syllabus overview, and sticky enrollment sidebar card
export default async function CourseDetails({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { msg?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,title,description,category,objectives,prerequisites,enrollment,status,course_modules(*, lessons(*))")
    .eq("id", params.id)
    .single();

  if (!course || course.status !== "published") notFound();

  // Find authenticated viewer and check their enrollment status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let enrollmentStatus: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    enrollmentStatus = enrollment?.status ?? null;
  }

  const moduleCount = course.course_modules?.length ?? 0;
  const lessonCount = (course.course_modules ?? []).reduce(
    (acc: number, m: { lessons?: unknown[] }) => acc + (m.lessons?.length ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-bg text-main selection:bg-primary/20">
      <PublicNav />

      {/* Course Banner */}
      <div className="border-b border-border bg-surface-2/70 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-main mb-4"
          >
            &larr; Back to all courses
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {course.category ?? "General"}
            </span>
            <span className="text-xs text-muted">
              {moduleCount} modules &middot; {lessonCount} lessons
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-main">
            {course.title}
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <Flash msg={searchParams.msg} error={searchParams.error} />

        <div className="grid gap-10 lg:grid-cols-12 mt-6">
          {/* Main Course Content */}
          <div className="lg:col-span-8 space-y-8">
            <section className="card space-y-4">
              <h2 className="font-serif text-2xl font-bold text-main">About this course</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line text-base">
                {course.description}
              </p>
            </section>

            {course.objectives && (
              <section className="card space-y-3 border-accent/20">
                <div className="flex items-center gap-2 text-accent">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="font-serif text-xl font-bold text-main">What you will learn</h2>
                </div>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {course.objectives}
                </p>
              </section>
            )}

            {course.prerequisites && (
              <section className="card space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="font-serif text-xl font-bold text-main">Prerequisites</h2>
                </div>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {course.prerequisites}
                </p>
              </section>
            )}
          </div>

          {/* Sticky Enrollment Card Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-border bg-surface p-7 shadow-lg space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Enrollment Option
                </span>
                <p className="font-serif text-2xl font-bold text-main mt-1 capitalize">
                  {course.enrollment === "open" ? "Free & Open Access" : `${course.enrollment} Enrollment`}
                </p>
              </div>

              <div className="space-y-3 text-sm text-muted">
                <div className="flex items-center gap-2.5">
                  <span className="text-success">✓</span>
                  <span>Full lifetime access to lesson content</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-success">✓</span>
                  <span>Integrated adaptive study planner</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-success">✓</span>
                  <span>Assignment submissions & grading</span>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                {!user && (
                  <Link href="/login" className="block">
                    <GlowButton variant="primary" size="lg" className="w-full">
                      Log in to enroll
                    </GlowButton>
                  </Link>
                )}

                {user && role === "student" && enrollmentStatus === "active" && (
                  <Link href={`/student/courses/${course.id}`} className="block">
                    <GlowButton variant="primary" size="lg" className="w-full">
                      Open course &rarr;
                    </GlowButton>
                  </Link>
                )}

                {user && role === "student" && enrollmentStatus === "pending" && (
                  <div className="rounded-xl border border-warning/30 bg-warning-subtle p-4 text-center">
                    <p className="text-xs font-bold text-warning uppercase tracking-wider">Status: Pending</p>
                    <p className="text-sm text-main mt-1">Your enrollment request is awaiting instructor approval.</p>
                  </div>
                )}

                {user && role === "student" && !enrollmentStatus && course.enrollment !== "restricted" && (
                  <form action={enrollInCourse}>
                    <input type="hidden" name="course_id" value={course.id} />
                    <GlowButton variant="primary" size="lg" className="w-full">
                      {course.enrollment === "open" ? "Enroll Now Free" : "Request Enrollment"}
                    </GlowButton>
                  </form>
                )}

                {user && role === "student" && !enrollmentStatus && course.enrollment === "restricted" && (
                  <p className="text-center text-sm text-muted">
                    Enrollment in this course is restricted. Contact your institution or instructor.
                  </p>
                )}

                {user && role !== "student" && (
                  <p className="text-center text-xs text-muted">
                    Logged in as {role}. Enrollment is for students.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
