"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formText, safeFileName, withFlash } from "@/lib/utils";

// Collects the course detail fields from the create/edit form into one object.
function courseFields(formData: FormData) {
  return {
    title: formText(formData, "title"),
    description: formText(formData, "description"),
    category: formText(formData, "category"),
    kind: formText(formData, "kind") ?? "theory",
    objectives: formText(formData, "objectives"),
    prerequisites: formText(formData, "prerequisites"),
    enrollment: formText(formData, "enrollment") ?? "open",
    min_quiz_score: Number(formData.get("min_quiz_score") ?? 50),
  };
}

// Redirects back to a course's editor page with a message or an error.
function back(courseId: string, kind: "msg" | "error", message: string): never {
  redirect(withFlash(`/instructor/courses/${courseId}`, kind, message));
}

// Server action: creates a new course owned by the logged-in instructor (starts as a draft),
// then opens its editor page. Row-level security rejects non-instructors.
export async function createCourse(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fields = courseFields(formData);
  if (!fields.title) redirect(withFlash("/instructor/courses/new", "error", "Title is required"));

  const { data, error } = await supabase
    .from("courses")
    .insert({ ...fields, instructor_id: user.id })
    .select("id")
    .single();
  if (error) redirect(withFlash("/instructor/courses/new", "error", error.message));

  redirect(`/instructor/courses/${data.id}`);
}

// Server action: saves changes to a course's details.
export async function updateCourse(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const fields = courseFields(formData);
  if (!fields.title) back(id, "error", "Title is required");

  const { error } = await supabase.from("courses").update(fields).eq("id", id);
  if (error) back(id, "error", error.message);
  back(id, "msg", "Course saved");
}

// Server action: changes a course's status (draft, published or archived).
export async function setCourseStatus(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["draft", "published", "archived"].includes(status)) back(id, "error", "Invalid status");

  const { error } = await supabase.from("courses").update({ status }).eq("id", id);
  if (error) back(id, "error", error.message);
  back(id, "msg", `Course is now ${status}`);
}

// Server action: adds a module (chapter) at the end of a course.
export async function addModule(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const title = formText(formData, "title");
  if (!title) back(courseId, "error", "Module title is required");

  // Counts existing modules so the new one goes last.
  const { count } = await supabase
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const { error } = await supabase.from("course_modules").insert({ course_id: courseId, title, position: count ?? 0 });
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Module added");
}

// Server action: deletes a module together with its lessons.
export async function deleteModule(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const { error } = await supabase.from("course_modules").delete().eq("id", String(formData.get("id")));
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Module deleted");
}

// Server action: adds a text lesson at the end of a module.
export async function addLesson(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const moduleId = String(formData.get("module_id"));
  const title = formText(formData, "title");
  if (!title) back(courseId, "error", "Lesson title is required");

  // Counts existing lessons so the new one goes last.
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);

  const { error } = await supabase
    .from("lessons")
    .insert({ module_id: moduleId, title, content: formText(formData, "content"), position: count ?? 0 });
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Lesson added");
}

// Server action: deletes a single lesson.
export async function deleteLesson(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const { error } = await supabase.from("lessons").delete().eq("id", String(formData.get("id")));
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Lesson deleted");
}

// Server action: uploads a learning material file to storage (folder = course id)
// and records it in the materials table.
export async function uploadMaterial(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) back(courseId, "error", "Choose a file to upload");

  const path = `${courseId}/${Date.now()}-${safeFileName(file!.name)}`;
  const upload = await supabase.storage
    .from("course-materials")
    .upload(path, file!, { contentType: file!.type || undefined });
  if (upload.error) back(courseId, "error", upload.error.message);

  const { error } = await supabase.from("materials").insert({
    course_id: courseId,
    module_id: formText(formData, "module_id"),
    title: formText(formData, "title") ?? file!.name,
    file_path: path,
    file_type: file!.type || null,
  });
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Material uploaded");
}

// Server action: deletes a material (the stored file and its database row).
export async function deleteMaterial(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const id = String(formData.get("id"));

  // Looks up the stored path from the database instead of trusting the form.
  const { data: material } = await supabase.from("materials").select("file_path").eq("id", id).single();
  if (material) await supabase.storage.from("course-materials").remove([material.file_path]);

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Material deleted");
}

// Server action: approves a pending enrollment request so the student can open the course.
export async function approveEnrollment(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const { error } = await supabase.from("enrollments").update({ status: "active" }).eq("id", String(formData.get("id")));
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Enrollment approved");
}

// Server action: removes an enrollment (rejects a request or removes a student from the course).
export async function removeEnrollment(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const { error } = await supabase.from("enrollments").delete().eq("id", String(formData.get("id")));
  if (error) back(courseId, "error", error.message);
  back(courseId, "msg", "Enrollment removed");
}
