import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";

// One enrollment row joined with its course, as returned by the query below.
interface EnrolledCourse {
  id: string;
  status: string;
  courses: { id: string; title: string; category: string | null } | null;
}

// "My courses" page: lists the courses the student is enrolled in (or has requested),
// with a link to open each active course.
export default async function MyCourses() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("enrollments")
    .select("id,status,courses(id,title,category)")
    .eq("student_id", user!.id)
    .order("enrolled_at", { ascending: false });
  const rows = (data ?? []) as unknown as EnrolledCourse[];

  return (
    <div className="space-y-6">
      <PageHeader title="My courses" action={<Link href="/courses" className="btn-ghost">Browse catalog</Link>} />
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((r) =>
          r.courses ? (
            <div key={r.id} className="card">
              <p className="text-xs font-medium uppercase tracking-wide text-water-600">{r.courses.category ?? "General"}</p>
              <h2 className="mt-1 font-semibold">{r.courses.title}</h2>
              {r.status === "pending" ? (
                <span className="badge mt-3 bg-amber-100 text-amber-800">Waiting for approval</span>
              ) : (
                <Link href={`/student/courses/${r.courses.id}`} className="btn mt-3">Open course</Link>
              )}
            </div>
          ) : null
        )}
        {rows.length === 0 && <p className="text-slate-500">You are not enrolled in any course yet.</p>}
      </div>
    </div>
  );
}
