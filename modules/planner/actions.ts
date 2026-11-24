"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentKind, CourseKind, StudyMethod, StudyMethodRule } from "@/lib/types";
import { daysBetween, formText, safeFileName, withFlash } from "@/lib/utils";
import { suggestMethods } from "./suggester";

// Redirects back to a study session's page with a message or an error.
function backToSession(sessionId: string, kind: "msg" | "error", message: string): never {
  redirect(withFlash(`/student/planner/sessions/${sessionId}`, kind, message));
}

// Server action: plans a new study session.
// The student picks what they are studying (an assignment or a whole course), a time, a length
// and how confident they feel. If they leave the method on "auto", the planner's rule engine
// picks the best study method and stores the reason so it can be shown as "Why this method?".
export async function createSession(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const target = String(formData.get("target") ?? "");        // "a:<assignment id>" or "c:<course id>"
  const title = formText(formData, "title");
  const startRaw = formText(formData, "planned_start");
  const minutes = Number(formData.get("planned_minutes") ?? 60);
  const confidence = Number(formData.get("confidence") ?? 3);
  const methodChoice = String(formData.get("method_id") ?? "auto");
  const form = "/student/planner/new";
  if (!target || !title || !startRaw || !(minutes > 0)) {
    redirect(withFlash(form, "error", "Choose what you study, a title, a start time and a length"));
  }
  const plannedStart = new Date(startRaw as string);

  // Works out the course (and the assignment deadline, if any) from the chosen target.
  let courseId: string;
  let assignmentId: string | null = null;
  let dueAt: string | null = null;
  if (target.startsWith("a:")) {
    const { data: assignment } = await supabase
      .from("assignments")
      .select("id,course_id,due_at")
      .eq("id", target.slice(2))
      .single();
    if (!assignment) redirect(withFlash(form, "error", "Assignment not found"));
    assignmentId = assignment.id;
    courseId = assignment.course_id;
    dueAt = assignment.due_at;
  } else {
    courseId = target.slice(2);
  }

  const { data: course } = await supabase.from("courses").select("kind").eq("id", courseId).single();
  if (!course) redirect(withFlash(form, "error", "Course not found"));

  // Chooses the study method: the student's own pick, or the planner's suggestion.
  let methodId: number | null = null;
  let reason: string | null = null;
  if (methodChoice === "auto") {
    const [methods, rules] = await Promise.all([
      supabase.from("study_methods").select("*"),
      supabase.from("study_method_rules").select("*"),
    ]);
    const best = suggestMethods(
      {
        courseKind: course.kind as CourseKind,
        assessment: (assignmentId ? "assignment" : "none") as AssessmentKind,
        daysLeft: dueAt ? daysBetween(plannedStart, new Date(dueAt)) : null,
        confidence,
        lastQuizScore: null,
        sessionMinutes: minutes,
      },
      (rules.data ?? []) as StudyMethodRule[],
      (methods.data ?? []) as StudyMethod[]
    )[0];
    if (best) {
      methodId = best.method.id;
      reason = best.reasons.join(" ");
    }
  } else {
    methodId = Number(methodChoice);
    reason = "Method chosen by you.";
  }

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      student_id: user.id,
      course_id: courseId,
      assignment_id: assignmentId,
      method_id: methodId,
      method_reason: reason,
      title,
      planned_start: plannedStart.toISOString(),
      planned_minutes: minutes,
    })
    .select("id")
    .single();
  if (error) redirect(withFlash(form, "error", error.message));

  redirect(`/student/planner/sessions/${data.id}`);
}

// Server action: finishes a study session. Saves the minutes actually studied, the outcome
// (completed or partial), the student's private notes, and an optional 1-5 rating of the method.
export async function finishSession(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessionId = String(formData.get("session_id"));
  const outcome = String(formData.get("outcome")) === "partial" ? "partial" : "completed";
  const actualMinutes = Math.max(0, Math.round(Number(formData.get("actual_minutes") ?? 0)));
  const rating = Number(formData.get("rating") ?? 0);

  const { data: session, error } = await supabase
    .from("study_sessions")
    .update({ status: outcome, actual_minutes: actualMinutes, notes: formText(formData, "notes") })
    .eq("id", sessionId)
    .select("method_id")
    .single();
  if (error) backToSession(sessionId, "error", error.message);

  // Saves the method rating (one per session).
  if (session?.method_id && rating >= 1 && rating <= 5) {
    await supabase
      .from("method_feedback")
      .upsert({ session_id: sessionId, student_id: user.id, method_id: session.method_id, rating }, { onConflict: "session_id" });
  }
  backToSession(sessionId, "msg", "Session saved. Well done!");
}

// Server action: marks a planned session as missed.
export async function markMissed(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("study_sessions").update({ status: "missed" }).eq("id", String(formData.get("id")));
  if (error) redirect(withFlash("/student/planner", "error", error.message));
  redirect(withFlash("/student/planner", "msg", "Session marked as missed"));
}

// Server action: reschedules a missed or planned session to a new time.
// The old session is kept as "rescheduled" and a new planned session is created with the same
// course, assignment, method and attached materials.
export async function rescheduleSession(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const startRaw = formText(formData, "planned_start");
  if (!startRaw) redirect(withFlash("/student/planner", "error", "Pick a new time"));

  const { data: old } = await supabase.from("study_sessions").select("*").eq("id", id).single();
  if (!old) redirect(withFlash("/student/planner", "error", "Session not found"));

  const { data: created, error } = await supabase
    .from("study_sessions")
    .insert({
      student_id: user.id,
      course_id: old.course_id,
      assignment_id: old.assignment_id,
      method_id: old.method_id,
      method_reason: old.method_reason,
      title: old.title,
      planned_start: new Date(startRaw as string).toISOString(),
      planned_minutes: old.planned_minutes,
      rescheduled_from: old.id,
    })
    .select("id")
    .single();
  if (error) redirect(withFlash("/student/planner", "error", error.message));

  // Copies the attached materials to the new session.
  const { data: attachments } = await supabase
    .from("session_materials")
    .select("material_id,personal_material_id")
    .eq("session_id", id);
  if (attachments && attachments.length > 0) {
    await supabase.from("session_materials").insert(attachments.map((a) => ({ ...a, session_id: created.id })));
  }

  await supabase.from("study_sessions").update({ status: "rescheduled" }).eq("id", id);
  redirect(withFlash("/student/planner", "msg", "Session rescheduled"));
}

// Server action: deletes a study session.
export async function deleteSession(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.from("study_sessions").delete().eq("id", String(formData.get("id")));
  if (error) redirect(withFlash("/student/planner", "error", error.message));
  redirect(withFlash("/student/planner", "msg", "Session deleted"));
}

// Server action: uploads the student's own material (notes, slides, a PDF) before or during a session.
// The file is stored privately under the student's id and attached to the session.
export async function uploadPersonalMaterial(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessionId = String(formData.get("session_id"));
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) backToSession(sessionId, "error", "Choose a file to upload");

  const { data: session } = await supabase.from("study_sessions").select("course_id").eq("id", sessionId).single();

  const path = `${user.id}/${Date.now()}-${safeFileName(file!.name)}`;
  const upload = await supabase.storage
    .from("personal-materials")
    .upload(path, file!, { contentType: file!.type || undefined });
  if (upload.error) backToSession(sessionId, "error", upload.error.message);

  const { data: material, error } = await supabase
    .from("personal_materials")
    .insert({
      student_id: user.id,
      course_id: session?.course_id ?? null,
      title: formText(formData, "title") ?? file!.name,
      file_path: path,
      file_type: file!.type || null,
    })
    .select("id")
    .single();
  if (error) backToSession(sessionId, "error", error.message);

  const link = await supabase
    .from("session_materials")
    .insert({ session_id: sessionId, personal_material_id: material!.id });
  if (link.error) backToSession(sessionId, "error", link.error.message);
  backToSession(sessionId, "msg", "Material added to this session");
}

// Server action: attaches one of the course's own materials to a study session.
export async function attachCourseMaterial(formData: FormData) {
  const supabase = createClient();
  const sessionId = String(formData.get("session_id"));
  const { error } = await supabase
    .from("session_materials")
    .insert({ session_id: sessionId, material_id: String(formData.get("material_id")) });
  if (error) backToSession(sessionId, "error", error.message);
  backToSession(sessionId, "msg", "Material attached");
}

// Server action: removes an attached material from a session (the file itself is kept).
export async function detachMaterial(formData: FormData) {
  const supabase = createClient();
  const sessionId = String(formData.get("session_id"));
  const { error } = await supabase.from("session_materials").delete().eq("id", String(formData.get("id")));
  if (error) backToSession(sessionId, "error", error.message);
  backToSession(sessionId, "msg", "Material removed from this session");
}
