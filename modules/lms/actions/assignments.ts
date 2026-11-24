"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formText, safeFileName, withFlash } from "@/lib/utils";

// Redirects back to a course's assignments page (instructor) with a message or error.
function backToList(courseId: string, kind: "msg" | "error", message: string): never {
  redirect(withFlash(`/instructor/courses/${courseId}/assignments`, kind, message));
}

// Redirects back to the grading page of one assignment (instructor) with a message or error.
function backToGrading(assignmentId: string, kind: "msg" | "error", message: string): never {
  redirect(withFlash(`/instructor/assignments/${assignmentId}`, kind, message));
}

// Redirects back to an assignment page (student) with a message or error.
function backToStudent(assignmentId: string, kind: "msg" | "error", message: string): never {
  redirect(withFlash(`/student/assignments/${assignmentId}`, kind, message));
}

// Server action: creates an assignment (title, instructions, due date, max score, resubmission rule).
export async function createAssignment(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const title = formText(formData, "title");
  const dueRaw = formText(formData, "due_at");
  if (!title || !dueRaw) backToList(courseId, "error", "Title and due date are required");

  const { error } = await supabase.from("assignments").insert({
    course_id: courseId,
    title,
    instructions: formText(formData, "instructions"),
    due_at: new Date(dueRaw as string).toISOString(),
    max_score: Number(formData.get("max_score") ?? 100),
    allow_resubmit: formData.get("allow_resubmit") === "on",
  });
  if (error) backToList(courseId, "error", error.message);
  backToList(courseId, "msg", "Assignment created");
}

// Server action: deletes an assignment together with its submissions.
export async function deleteAssignment(formData: FormData) {
  const supabase = createClient();
  const courseId = String(formData.get("course_id"));
  const { error } = await supabase.from("assignments").delete().eq("id", String(formData.get("id")));
  if (error) backToList(courseId, "error", error.message);
  backToList(courseId, "msg", "Assignment deleted");
}

// Server action: saves a score and feedback on a student's submission.
// The score must be between 0 and the assignment's maximum score.
export async function gradeSubmission(formData: FormData) {
  const supabase = createClient();
  const assignmentId = String(formData.get("assignment_id"));
  const submissionId = String(formData.get("submission_id"));
  const rawScore = formText(formData, "score");
  if (rawScore === null) backToGrading(assignmentId, "error", "Enter a score");

  const score = Number(rawScore);
  const { data: assignment } = await supabase.from("assignments").select("max_score").eq("id", assignmentId).single();
  const max = assignment?.max_score ?? 100;
  if (Number.isNaN(score) || score < 0 || score > max) {
    backToGrading(assignmentId, "error", `Score must be between 0 and ${max}`);
  }

  const { error } = await supabase
    .from("submissions")
    .update({ score, feedback: formText(formData, "feedback"), graded_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) backToGrading(assignmentId, "error", error.message);
  backToGrading(assignmentId, "msg", "Grade saved");
}

// Server action: submits a student's answer to an assignment (text, a file, or both).
// The file goes to the private "submissions" bucket under <assignment id>/<student id>/.
// Row-level security rejects the submission if the student is not enrolled
// or has already submitted and resubmission is not allowed.
export async function submitAssignment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const assignmentId = String(formData.get("assignment_id"));
  const answer = formText(formData, "text_answer");
  const file = formData.get("file") as File | null;
  const hasFile = !!file && file.size > 0;
  if (!answer && !hasFile) backToStudent(assignmentId, "error", "Write an answer or attach a file");

  // Uploads the file first (if any) and remembers its storage path.
  let filePath: string | null = null;
  if (hasFile) {
    filePath = `${assignmentId}/${user.id}/${Date.now()}-${safeFileName((file as File).name)}`;
    const upload = await supabase.storage.from("submissions").upload(filePath, file as File, {
      contentType: (file as File).type || undefined,
    });
    if (upload.error) backToStudent(assignmentId, "error", "Could not upload the file: " + upload.error.message);
  }

  const { error } = await supabase
    .from("submissions")
    .insert({ assignment_id: assignmentId, student_id: user.id, text_answer: answer, file_path: filePath });
  if (error) backToStudent(assignmentId, "error", "You cannot submit this assignment (already submitted, or not enrolled).");
  backToStudent(assignmentId, "msg", "Submitted successfully");
}
