import Link from "next/link";
import { notFound } from "next/navigation";
import CourseFields from "@/components/lms/CourseFields";
import EnrollmentPanel, { type EnrollmentRow } from "@/components/lms/EnrollmentPanel";
import Flash from "@/components/ui/Flash";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import type { Course, CourseModule, Material } from "@/lib/types";
import {
  addLesson,
  addModule,
  deleteLesson,
  deleteMaterial,
  deleteModule,
  setCourseStatus,
  updateCourse,
  uploadMaterial,
} from "@/modules/lms/actions/courses";

// Course editor page. The instructor can edit the course details, publish or archive it,
// build modules and lessons, upload learning materials, manage assignments and students.
export default async function CourseEditor({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { msg?: string; error?: string };
}) {
  const supabase = createClient();

  // Loads the course with its modules, lessons and materials in one query.
  const { data } = await supabase
    .from("courses")
    .select("*, course_modules(*, lessons(*)), materials(*)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();

  const course = data as Course & { course_modules: CourseModule[]; materials: Material[] };

  // Sorts modules and lessons by their position.
  const modules = [...course.course_modules].sort((a, b) => a.position - b.position);
  modules.forEach((m) => m.lessons.sort((a, b) => a.position - b.position));

  // Loads the course's enrollments with each student's name.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id,status,profiles(full_name)")
    .eq("course_id", params.id);

  // Creates a temporary download link (valid for 1 hour) for each uploaded material.
  const materials = await Promise.all(
    course.materials.map(async (m) => {
      const { data: signed } = await supabase.storage.from("course-materials").createSignedUrl(m.file_path, 3600);
      return { ...m, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-8">
      {/* Header: title, status and status buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <div className="mt-1"><StatusBadge status={course.status} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/instructor/courses/${course.id}/assignments`} className="btn-ghost">Assignments</Link>
          {(["draft", "published", "archived"] as const)
            .filter((s) => s !== course.status)
            .map((s) => (
              <form key={s} action={setCourseStatus}>
                <input type="hidden" name="id" value={course.id} />
                <input type="hidden" name="status" value={s} />
                <button className={s === "published" ? "btn" : "btn-ghost"}>
                  {s === "published" ? "Publish" : s === "draft" ? "Move to draft" : "Archive"}
                </button>
              </form>
            ))}
        </div>
      </div>

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {/* Course details */}
      <form action={updateCourse} className="card space-y-4">
        <h2 className="font-semibold">Course details</h2>
        <input type="hidden" name="id" value={course.id} />
        <CourseFields course={course} />
        <button className="btn">Save details</button>
      </form>

      {/* Modules and lessons */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Modules and lessons</h2>
        {modules.map((m) => (
          <div key={m.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{m.title}</h3>
              <form action={deleteModule}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <button className="btn-danger">Delete module</button>
              </form>
            </div>
            <ul className="space-y-1 text-sm">
              {m.lessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-lg bg-water-50 px-3 py-2">
                  <span>{l.title}</span>
                  <form action={deleteLesson}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="course_id" value={course.id} />
                    <button className="btn-danger">Delete</button>
                  </form>
                </li>
              ))}
              {m.lessons.length === 0 && <li className="text-slate-500">No lessons yet.</li>}
            </ul>
            <form action={addLesson} className="space-y-2 border-t border-water-100 pt-3">
              <input type="hidden" name="module_id" value={m.id} />
              <input type="hidden" name="course_id" value={course.id} />
              <input name="title" placeholder="New lesson title" required className="input" />
              <textarea name="content" rows={2} placeholder="Lesson text (optional)" className="input" />
              <button className="btn-ghost">Add lesson</button>
            </form>
          </div>
        ))}
        <form action={addModule} className="card flex gap-2">
          <input type="hidden" name="course_id" value={course.id} />
          <input name="title" placeholder="New module title" required className="input" />
          <button className="btn whitespace-nowrap">Add module</button>
        </form>
      </section>

      {/* Learning materials */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Learning materials</h2>
        <ul className="space-y-2 text-sm">
          {materials.map((m) => (
            <li key={m.id} className="card flex items-center justify-between py-3">
              {m.url ? <a href={m.url} className="font-medium text-water-700" target="_blank">{m.title}</a> : <span>{m.title}</span>}
              <form action={deleteMaterial}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <button className="btn-danger">Delete</button>
              </form>
            </li>
          ))}
          {materials.length === 0 && <li className="text-slate-500">No materials uploaded yet.</li>}
        </ul>
        <form action={uploadMaterial} className="card space-y-2">
          <input type="hidden" name="course_id" value={course.id} />
          <input name="title" placeholder="Title (optional)" className="input" />
          <select name="module_id" className="input" defaultValue="">
            <option value="">Not tied to a module</option>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <input name="file" type="file" required className="text-sm" />
          <button className="btn">Upload material</button>
        </form>
      </section>

      {/* Enrolled students and enrollment requests */}
      <EnrollmentPanel courseId={course.id} rows={(enrollments ?? []) as unknown as EnrollmentRow[]} />
    </div>
  );
}
