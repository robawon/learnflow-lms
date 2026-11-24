import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import PublicNav from "@/components/ui/PublicNav";
import { createClient } from "@/lib/supabase/server";
import { enrollInCourse } from "@/modules/lms/actions/enrollment";

// Public course details page. Shows the course information and, depending on who is viewing,
// an enroll button (students), a link to the course (enrolled students), or a login prompt.
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
    .select("id,title,description,category,objectives,prerequisites,enrollment,status")
    .eq("id", params.id)
    .single();
  if (!course || course.status !== "published") notFound();

  // Finds out who is viewing, their role, and whether they are already enrolled.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let role: string | null = null;
  let enrollmentStatus: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = profile?.role ?? null;
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("status")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    enrollmentStatus = enrollment?.status ?? null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-water-50 to-white">
      <PublicNav />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Link href="/courses" className="text-sm font-medium text-water-700">&larr; All courses</Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-water-600">{course.category ?? "General"}</p>
          <h1 className="text-3xl font-semibold">{course.title}</h1>
        </div>

        <Flash msg={searchParams.msg} error={searchParams.error} />

        <p className="text-slate-700">{course.description}</p>
        {course.objectives && (
          <div className="card"><h2 className="font-semibold">Learning objectives</h2><p className="mt-1 text-sm">{course.objectives}</p></div>
        )}
        {course.prerequisites && (
          <div className="card"><h2 className="font-semibold">Prerequisites</h2><p className="mt-1 text-sm">{course.prerequisites}</p></div>
        )}

        {/* Enrollment call to action */}
        <div>
          {!user && <Link href="/login" className="btn">Log in to enroll</Link>}
          {user && role === "student" && enrollmentStatus === "active" && (
            <Link href={`/student/courses/${course.id}`} className="btn">Open course</Link>
          )}
          {user && role === "student" && enrollmentStatus === "pending" && (
            <p className="text-sm text-slate-600">Your enrollment request is waiting for approval.</p>
          )}
          {user && role === "student" && !enrollmentStatus && course.enrollment !== "restricted" && (
            <form action={enrollInCourse}>
              <input type="hidden" name="course_id" value={course.id} />
              <button className="btn">{course.enrollment === "open" ? "Enroll" : "Request enrollment"}</button>
            </form>
          )}
          {user && role === "student" && !enrollmentStatus && course.enrollment === "restricted" && (
            <p className="text-sm text-slate-600">Enrollment in this course is restricted. Contact the instructor.</p>
          )}
        </div>
      </main>
    </div>
  );
}
