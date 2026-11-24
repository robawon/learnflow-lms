import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";

// One course with its instructor's name, as returned by the query below.
interface CourseRow {
  id: string;
  title: string;
  status: string;
  category: string | null;
  profiles: { full_name: string } | null;
}

// Administrator course oversight: lists every course on the platform with its instructor and status.
export default async function AdminCourses() {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("id,title,status,category,profiles(full_name)")
    .order("created_at", { ascending: false });
  const courses = (data ?? []) as unknown as CourseRow[];

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" subtitle="Every course on the platform." />
      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <h2 className="font-medium">{c.title}</h2>
              <p className="text-sm text-slate-500">{c.category ?? "General"} &middot; {c.profiles?.full_name ?? "Unknown instructor"}</p>
            </div>
            <StatusBadge status={c.status} />
          </div>
        ))}
        {courses.length === 0 && <p className="text-slate-500">No courses yet.</p>}
      </div>
    </div>
  );
}
