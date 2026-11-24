import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CourseModule, Material } from "@/lib/types";
import { toggleLessonComplete, withdrawFromCourse } from "@/modules/lms/actions/enrollment";

// Student course view. Shows the course modules, lessons and materials,
// lets the student mark lessons as completed, and shows their progress percentage.
// Students who are not actively enrolled are sent back to the course details page.
export default async function StudentCourse({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only active enrollments may open the course content.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("status")
    .eq("student_id", user!.id)
    .eq("course_id", params.id)
    .maybeSingle();
  if (!enrollment || enrollment.status === "pending") redirect(`/courses/${params.id}`);

  const { data } = await supabase
    .from("courses")
    .select("id,title,description,objectives,course_modules(*, lessons(*)), materials(*)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();
  const course = data as unknown as {
    id: string;
    title: string;
    description: string | null;
    objectives: string | null;
    course_modules: CourseModule[];
    materials: Material[];
  };

  // Sorts modules and lessons by their position.
  const modules = [...course.course_modules].sort((a, b) => a.position - b.position);
  modules.forEach((m) => m.lessons.sort((a, b) => a.position - b.position));

  // Loads which of these lessons the student has completed, and computes the progress percentage.
  const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const { data: progress } = lessonIds.length
    ? await supabase.from("lesson_progress").select("lesson_id").eq("student_id", user!.id).in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string }[] };
  const done = new Set((progress ?? []).map((p) => p.lesson_id));
  const percent = lessonIds.length ? Math.round((done.size / lessonIds.length) * 100) : 0;

  // Creates a temporary download link (valid for 1 hour) for each material.
  const materials = await Promise.all(
    course.materials.map(async (m) => {
      const { data: signed } = await supabase.storage.from("course-materials").createSignedUrl(m.file_path, 3600);
      return { ...m, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <Link href="/student/courses" className="text-sm font-medium text-water-700">&larr; My courses</Link>
      <div>
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <p className="mt-1 text-slate-600">{course.description}</p>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between text-sm"><span>Progress</span><span className="font-medium">{percent}%</span></div>
        <div className="mt-2 h-2 rounded-full bg-water-100"><div className="h-2 rounded-full bg-water-500" style={{ width: `${percent}%` }} /></div>
        <p className="mt-1 text-xs text-slate-500">{done.size} of {lessonIds.length} lessons completed</p>
      </div>

      {/* Modules and lessons */}
      {modules.map((m) => (
        <section key={m.id} className="card space-y-3">
          <h2 className="font-semibold">{m.title}</h2>
          {m.lessons.map((l) => {
            const completed = done.has(l.id);
            return (
              <details key={l.id} className="rounded-lg border border-water-100 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">{completed ? "✓ " : ""}{l.title}</summary>
                {l.content && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{l.content}</p>}
                <form action={toggleLessonComplete} className="mt-3">
                  <input type="hidden" name="course_id" value={course.id} />
                  <input type="hidden" name="lesson_id" value={l.id} />
                  <input type="hidden" name="completed" value={completed ? "1" : "0"} />
                  <button className={completed ? "btn-ghost" : "btn"}>{completed ? "Mark as not done" : "Mark as completed"}</button>
                </form>
              </details>
            );
          })}
          {m.lessons.length === 0 && <p className="text-sm text-slate-500">No lessons yet.</p>}
        </section>
      ))}
      {modules.length === 0 && <p className="text-slate-500">The instructor has not added content yet.</p>}

      {/* Materials */}
      <section className="space-y-2">
        <h2 className="font-semibold">Learning materials</h2>
        <ul className="space-y-2 text-sm">
          {materials.map((m) => (
            <li key={m.id} className="card py-3">
              {m.url ? <a href={m.url} target="_blank" className="font-medium text-water-700">{m.title}</a> : m.title}
            </li>
          ))}
          {materials.length === 0 && <li className="text-slate-500">No materials yet.</li>}
        </ul>
      </section>

      <form action={withdrawFromCourse}>
        <input type="hidden" name="course_id" value={course.id} />
        <button className="btn-danger">Withdraw from this course</button>
      </form>
    </div>
  );
}
