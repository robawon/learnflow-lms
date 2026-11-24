import type { Course } from "@/lib/types";

// The course detail inputs, shared by the "new course" and "edit course" forms.
// Pass an existing course to pre-fill the values.
export default function CourseFields({ course }: { course?: Course }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Title
        <input name="title" required defaultValue={course?.title} className="input mt-1" />
      </label>
      <label className="block text-sm font-medium">Description
        <textarea name="description" rows={3} defaultValue={course?.description ?? ""} className="input mt-1" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">Category
          <input name="category" defaultValue={course?.category ?? ""} className="input mt-1" />
        </label>
        <label className="block text-sm font-medium">Course type (used by the study planner)
          <select name="kind" defaultValue={course?.kind ?? "theory"} className="input mt-1">
            <option value="theory">Theory</option>
            <option value="problem_solving">Problem solving</option>
            <option value="programming">Programming</option>
            <option value="writing">Writing / project</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Enrollment
          <select name="enrollment" defaultValue={course?.enrollment ?? "open"} className="input mt-1">
            <option value="open">Open</option>
            <option value="approval">Approval required</option>
            <option value="restricted">Restricted</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Minimum quiz score for completion (%)
          <input name="min_quiz_score" type="number" min={0} max={100} defaultValue={course?.min_quiz_score ?? 50} className="input mt-1" />
        </label>
      </div>
      <label className="block text-sm font-medium">Learning objectives
        <textarea name="objectives" rows={2} defaultValue={course?.objectives ?? ""} className="input mt-1" />
      </label>
      <label className="block text-sm font-medium">Prerequisites
        <textarea name="prerequisites" rows={2} defaultValue={course?.prerequisites ?? ""} className="input mt-1" />
      </label>
    </div>
  );
}
