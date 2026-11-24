import { approveEnrollment, removeEnrollment } from "@/modules/lms/actions/courses";

// One enrollment row with the student's name, as loaded by the course editor page.
export interface EnrollmentRow {
  id: string;
  status: string;
  profiles: { full_name: string } | null;
}

// Shows a course's enrolled students and pending requests to the instructor,
// with buttons to approve a request or remove a student.
export default function EnrollmentPanel({ courseId, rows }: { courseId: string; rows: EnrollmentRow[] }) {
  const pending = rows.filter((r) => r.status === "pending");
  const active = rows.filter((r) => r.status !== "pending");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Students</h2>

      {pending.length > 0 && (
        <div className="card space-y-2">
          <h3 className="font-medium">Enrollment requests ({pending.length})</h3>
          {pending.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span>{r.profiles?.full_name ?? "Unknown student"}</span>
              <div className="flex gap-2">
                <form action={approveEnrollment}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="course_id" value={courseId} />
                  <button className="btn">Approve</button>
                </form>
                <form action={removeEnrollment}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="course_id" value={courseId} />
                  <button className="btn-ghost">Reject</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card space-y-2">
        <h3 className="font-medium">Enrolled ({active.length})</h3>
        {active.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-sm">
            <span>{r.profiles?.full_name ?? "Unknown student"}</span>
            <form action={removeEnrollment}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="course_id" value={courseId} />
              <button className="btn-danger">Remove</button>
            </form>
          </div>
        ))}
        {active.length === 0 && <p className="text-sm text-slate-500">No students enrolled yet.</p>}
      </div>
    </section>
  );
}
