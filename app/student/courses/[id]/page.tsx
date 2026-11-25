import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CourseModule, Material } from "@/lib/types";
import StudentCourseViewer from "@/components/lms/StudentCourseViewer";

// Student course view: loads course data on the server and renders the interactive StudentCourseViewer
export default async function StudentCourse({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate active enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("status")
    .eq("student_id", user!.id)
    .eq("course_id", params.id)
    .maybeSingle();

  if (!enrollment || enrollment.status === "pending") {
    redirect(`/courses/${params.id}`);
  }

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

  const modules = [...course.course_modules].sort((a, b) => a.position - b.position);
  modules.forEach((m) => m.lessons.sort((a, b) => a.position - b.position));

  const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const { data: progress } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("student_id", user!.id)
        .in("lesson_id", lessonIds)
    : { data: [] as { lesson_id: string }[] };

  const doneIds = (progress ?? []).map((p) => p.lesson_id);

  const materials = await Promise.all(
    course.materials.map(async (m) => {
      const { data: signed } = await supabase.storage
        .from("course-materials")
        .createSignedUrl(m.file_path, 3600);
      return { ...m, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <StudentCourseViewer
      course={course}
      modules={modules}
      materials={materials}
      initialDoneIds={doneIds}
      totalLessons={lessonIds.length}
    />
  );
}
