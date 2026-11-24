// Shared TypeScript types that describe the database rows used across the platform.

// The three user roles in the system.
export type Role = "student" | "instructor" | "admin";

// The kind of course; the study method suggester uses this to choose methods.
export type CourseKind = "theory" | "problem_solving" | "programming" | "writing";

// The type of upcoming assessment a student is preparing for.
export type AssessmentKind = "none" | "quiz" | "assignment" | "midterm" | "final";

// One row of the profiles table.
export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: Role;
  status: "active" | "suspended" | "pending";
  created_at: string;
}

// One row of the courses table.
export interface Course {
  id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  category: string | null;
  kind: CourseKind;
  objectives: string | null;
  prerequisites: string | null;
  enrollment: "open" | "approval" | "restricted";
  status: "draft" | "published" | "archived";
  min_quiz_score: number | null;
}

// One row of the lessons table.
export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  position: number;
}

// One row of the course_modules table, with its lessons attached by the query.
export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

// One row of the materials table (an uploaded course file).
export interface Material {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  file_path: string;
  file_type: string | null;
}

// One row of the assignments table.
export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  instructions: string | null;
  due_at: string;
  max_score: number | null;
  allow_resubmit: boolean | null;
}

// One row of the submissions table (a student's answer to an assignment).
export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  text_answer: string | null;
  file_path: string | null;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
}

// One row of the study_methods table: a study technique the platform can recommend.
export interface StudyMethod {
  id: number;
  slug: string;
  name: string;
  description: string;
  best_for: string;
  steps: string[];
  min_minutes: number | null;
}

// One row of the study_method_rules table: a condition that favours a method.
// A null condition means "any value".
export interface StudyMethodRule {
  id: number;
  method_id: number;
  course_kind: CourseKind | null;
  assessment: AssessmentKind | null;
  max_days_left: number | null;
  min_days_left: number | null;
  max_confidence: number | null;
  max_last_score: number | null;
  min_session_min: number | null;
  weight: number;
  reason: string;
}

// The possible states of a planned study session.
export type SessionStatus = "planned" | "in_progress" | "completed" | "partial" | "missed" | "rescheduled";

// One row of the study_sessions table.
export interface StudySession {
  id: string;
  student_id: string;
  course_id: string | null;
  assignment_id: string | null;
  method_id: number | null;
  method_reason: string | null;
  title: string;
  planned_start: string;
  planned_minutes: number;
  status: SessionStatus;
  actual_minutes: number | null;
  notes: string | null;
  rescheduled_from: string | null;
}
