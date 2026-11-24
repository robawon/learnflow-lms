import Link from "next/link";
import PublicNav from "@/components/ui/PublicNav";
import { createClient } from "@/lib/supabase/server";

// Public course catalog. Lists published courses (newest first)
// and filters them by title when a search term (?q=...) is given.
export default async function CoursesPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  let query = supabase
    .from("courses")
    .select("id,title,description,category")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);
  const { data: courses } = await query;

  return (
    <div className="min-h-screen bg-gradient-to-b from-water-50 to-white">
      <PublicNav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-3xl font-semibold">Course catalog</h1>
        <form className="my-6">
          <input name="q" defaultValue={searchParams.q} placeholder="Search courses..." className="input max-w-sm" />
        </form>
        <div className="grid gap-4 sm:grid-cols-2">
          {courses?.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} className="card transition hover:border-water-300 hover:shadow-md">
              <p className="text-xs font-medium uppercase tracking-wide text-water-600">{c.category ?? "General"}</p>
              <h2 className="mt-1 font-semibold">{c.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>
            </Link>
          ))}
          {courses?.length === 0 && <p className="text-slate-500">No published courses yet.</p>}
        </div>
      </main>
    </div>
  );
}
