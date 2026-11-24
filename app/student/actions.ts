"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Server action: enrolls the logged-in student in a course.
// Open courses activate immediately, approval courses create a pending request,
// and restricted courses cannot be joined by students.
export async function enrollInCourse(formData: FormData) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const courseId = String(formData.get("course_id"));
    const { data: course } = await supabase.from("courses").select("enrollment,status").eq("id", courseId).single();
    if (!course || course.status !== "published") {
        redirect(`/courses/${courseId}?error=${encodeURIComponent("This course is not open for enrollment")}`);
    }
    if (course.enrollment === "restricted") {
        redirect(`/courses/${courseId}?error=${encodeURIComponent("Enrollment is restricted. Ask the instructor.")}`);
    }

    const status = course.enrollment === "open" ? "active" : "pending";
    const { error } = await supabase.from("enrollments").insert({ student_id: user.id, course_id: courseId, status });
    if (error) redirect(`/courses/${courseId}?error=${encodeURIComponent(error.message)}`);

    if (status === "active") redirect(`/student/courses/${courseId}`);
    redirect(`/courses/${courseId}?msg=${encodeURIComponent("Request sent. The instructor will approve it.")}`);
}

// Server action: withdraws the logged-in student from a course (deletes their enrollment).
export async function withdrawFromCourse(formData: FormData) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await supabase
        .from("enrollments")
        .delete()
        .eq("student_id", user.id)
        .eq("course_id", String(formData.get("course_id")));
    redirect("/student/courses");
}

// Server action: marks a lesson as completed, or removes the mark if it was already completed.
export async function toggleLessonComplete(formData: FormData) {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const courseId = String(formData.get("course_id"));
    const lessonId = String(formData.get("lesson_id"));
    const wasCompleted = formData.get("completed") === "1";

    if (wasCompleted) {
        await supabase.from("lesson_progress").delete().eq("student_id", user.id).eq("lesson_id", lessonId);
    } else {
        await supabase.from("lesson_progress").insert({ student_id: user.id, lesson_id: lessonId });
    }
    redirect(`/student/courses/${courseId}`);
}