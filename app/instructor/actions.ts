"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Reads a text field from a form, trims it, and returns null when it is empty.
function text(formData: FormData, key: string): string | null {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
}

// Collects the course detail fields from the create/edit form into one object.
function courseFields(formData: FormData) {
    return {
        title: text(formData, "title"),
        description: text(formData, "description"),
        category: text(formData, "category"),
        kind: text(formData, "kind") ?? "theory",
        objectives: text(formData, "objectives"),
        prerequisites: text(formData, "prerequisites"),
        enrollment: text(formData, "enrollment") ?? "open",
        min_quiz_score: Number(formData.get("min_quiz_score") ?? 50),
    };
}

// Redirects back to a course's editor page with a message (?msg=...) or error (?error=...).
function backToCourse(courseId: string, kind: "msg" | "error", message: string): never {
    redirect(`/instructor/courses/${courseId}?${kind}=${encodeURIComponent(message)}`);
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
    if (!fields.title) redirect("/instructor/courses/new?error=" + encodeURIComponent("Title is required"));

    const { data, error } = await supabase
        .from("courses")
        .insert({ ...fields, instructor_id: user.id })
        .select("id")
        .single();
    if (error) redirect("/instructor/courses/new?error=" + encodeURIComponent(error.message));

    redirect(`/instructor/courses/${data.id}`);
}

// Server action: saves changes to a course's details.
export async function updateCourse(formData: FormData) {
    const supabase = createClient();
    const id = String(formData.get("id"));
    const fields = courseFields(formData);
    if (!fields.title) backToCourse(id, "error", "Title is required");

    const { error } = await supabase.from("courses").update(fields).eq("id", id);
    if (error) backToCourse(id, "error", error.message);
    backToCourse(id, "msg", "Course saved");
}

// Server action: changes a course's status (draft, published or archived).
export async function setCourseStatus(formData: FormData) {
    const supabase = createClient();
    const id = String(formData.get("id"));
    const status = String(formData.get("status"));
    if (!["draft", "published", "archived"].includes(status)) backToCourse(id, "error", "Invalid status");

    const { error } = await supabase.from("courses").update({ status }).eq("id", id);
    if (error) backToCourse(id, "error", error.message);
    backToCourse(id, "msg", `Course is now ${status}`);
}

// Server action: adds a module (chapter) at the end of a course.
export async function addModule(formData: FormData) {
    const supabase = createClient();
    const courseId = String(formData.get("course_id"));
    const title = text(formData, "title");
    if (!title) backToCourse(courseId, "error", "Module title is required");

    // Counts existing modules so the new one goes last.
    const { count } = await supabase
        .from("course_modules")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId);

    const { error } = await supabase
        .from("course_modules")
        .insert({ course_id: courseId, title, position: count ?? 0 });
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Module added");
}

// Server action: deletes a module together with its lessons.
export async function deleteModule(formData: FormData) {
    const supabase = createClient();
    const courseId = String(formData.get("course_id"));
    const { error } = await supabase.from("course_modules").delete().eq("id", String(formData.get("id")));
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Module deleted");
}

// Server action: adds a text lesson at the end of a module.
export async function addLesson(formData: FormData) {
    const supabase = createClient();
    const courseId = String(formData.get("course_id"));
    const moduleId = String(formData.get("module_id"));
    const title = text(formData, "title");
    if (!title) backToCourse(courseId, "error", "Lesson title is required");

    // Counts existing lessons so the new one goes last.
    const { count } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("module_id", moduleId);

    const { error } = await supabase
        .from("lessons")
        .insert({ module_id: moduleId, title, content: text(formData, "content"), position: count ?? 0 });
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Lesson added");
}

// Server action: deletes a single lesson.
export async function deleteLesson(formData: FormData) {
    const supabase = createClient();
    const courseId = String(formData.get("course_id"));
    const { error } = await supabase.from("lessons").delete().eq("id", String(formData.get("id")));
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Lesson deleted");
}

// Server action: uploads a learning material file to storage (folder = course id)
// and records it in the materials table.
export async function uploadMaterial(formData: FormData) {
    const supabase = createClient();
    const courseId = String(formData.get("course_id"));
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) backToCourse(courseId, "error", "Choose a file to upload");

    // Replaces unsafe characters so the storage path is valid.
    const safeName = file!.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${courseId}/${Date.now()}-${safeName}`;

    const upload = await supabase.storage
        .from("course-materials")
        .upload(path, file!, { contentType: file!.type || undefined });
    if (upload.error) backToCourse(courseId, "error", upload.error.message);

    const { error } = await supabase.from("materials").insert({
        course_id: courseId,
        module_id: text(formData, "module_id"),
        title: text(formData, "title") ?? file!.name,
        file_path: path,
        file_type: file!.type || null,
    });
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Material uploaded");
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
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Material deleted");
}

// Server action: approves a pending enrollment request so the student can open the course.
export async function approveEnrollment(formData: FormData) {
    const supabase = createClient();
    const courseId = String(formData.get("course_id"));
    const { error } = await supabase
        .from("enrollments")
        .update({ status: "active" })
        .eq("id", String(formData.get("id")));
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Enrollment approved");
}

// Server action: removes an enrollment (rejects a request or removes a student from the course).
export async function removeEnrollment(formData: FormData) {
    const supabase = createClient();
    const courseId = String(formData.get("course_id"));
    const { error } = await supabase.from("enrollments").delete().eq("id", String(formData.get("id")));
    if (error) backToCourse(courseId, "error", error.message);
    backToCourse(courseId, "msg", "Enrollment removed");
}