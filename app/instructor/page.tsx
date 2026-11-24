import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";

// Instructor dashboard: lists the courses owned by the logged-in instructor
// with their status, and links to create or edit a course.
export default async function InstructorHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,status,category")
    .eq("instructor_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        subtitle="Create courses, add lessons and assignments, and manage your students."
        action={<Link href="/instructor/courses/new" className="btn">New course</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {courses?.map((c) => (
          <Link key={c.id} href={`/instructor/courses/${c.id}`} className="card transition hover:border-water-300 hover:shadow-md">
            <p className="text-xs font-medium uppercase tracking-wide text-water-600">{c.category ?? "General"}</p>
            <h2 className="mt-1 font-semibold">{c.title}</h2>
            <div className="mt-3"><StatusBadge status={c.status} /></div>
          </Link>
        ))}
        {courses?.length === 0 && <p className="text-slate-500">You have no courses yet. Create your first one.</p>}
      </div>
    </div>
  );
}
