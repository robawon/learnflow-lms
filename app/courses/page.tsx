import Link from "next/link";
import PublicNav from "@/components/ui/PublicNav";
import GlowCard from "@/components/ui/GlowCard";
import { createClient } from "@/lib/supabase/server";

// Dynamic gradient generator based on course title to give each card an alive thumbnail
function getGradientFromTitle(title: string) {
  const gradients = [
    "from-blue-600 to-indigo-800",
    "from-amber-600 to-amber-900",
    "from-emerald-600 to-teal-800",
    "from-sky-500 to-blue-700",
    "from-purple-600 to-indigo-900",
    "from-orange-500 to-red-800",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Available categories for filter chips
const CATEGORIES = ["All", "Computer Science", "Business", "Mathematics", "Science", "Design", "General"];

// Public course catalog with category filter chips, search input, and alive gradient thumbnails
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("courses")
    .select("id,title,description,category")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (searchParams.q) query = query.ilike("title", `%${searchParams.q}%`);
  if (searchParams.category && searchParams.category !== "All") {
    query = query.eq("category", searchParams.category);
  }

  const { data: courses } = await query;

  return (
    <div className="min-h-screen bg-bg text-main selection:bg-primary/20">
      <PublicNav />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        {/* Banner header */}
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-main">
            Course Catalog
          </h1>
          <p className="mt-2 text-base text-muted">
            Explore world-class courses designed to accelerate your mastery with our built-in study planner.
          </p>
        </div>

        {/* Search & Category Filter Section */}
        <div className="mt-8 space-y-4">
          <form className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search by course title..."
              className="input pl-10 h-11"
            />
          </form>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {CATEGORIES.map((cat) => {
              const active =
                (!searchParams.category && cat === "All") ||
                searchParams.category === cat;
              return (
                <Link
                  key={cat}
                  href={`/courses?${new URLSearchParams({
                    ...(searchParams.q ? { q: searchParams.q } : {}),
                    ...(cat !== "All" ? { category: cat } : {}),
                  }).toString()}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "border border-border bg-surface text-muted hover:border-primary/40 hover:text-main"
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses?.map((c) => {
            const gradient = getGradientFromTitle(c.title);
            return (
              <Link key={c.id} href={`/courses/${c.id}`} className="block group">
                <GlowCard className="h-full flex flex-col justify-between p-0 overflow-hidden border-border/70 hover:border-primary/40">
                  {/* Generated gradient thumbnail */}
                  <div className={`relative h-44 w-full bg-gradient-to-tr ${gradient} p-5 flex flex-col justify-between text-white`}>
                    <div className="flex justify-between items-start">
                      <span className="rounded-full bg-black/30 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                        {c.category ?? "General"}
                      </span>
                      <span className="rounded-full bg-white/20 p-1.5 backdrop-blur-md">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>

                    <h2 className="font-serif text-lg font-bold line-clamp-2 drop-shadow-md text-white">
                      {c.title}
                    </h2>
                  </div>

                  {/* Card description body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <p className="line-clamp-3 text-sm text-muted leading-relaxed">
                      {c.description || "Comprehensive curriculum including modules, lessons, and assignments."}
                    </p>

                    <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>View details & modules</span>
                      <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                    </div>
                  </div>
                </GlowCard>
              </Link>
            );
          })}

          {courses?.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center bg-surface">
              <svg className="mx-auto h-12 w-12 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-3 font-serif text-lg font-bold text-main">No courses found</h3>
              <p className="mt-1 text-sm text-muted">Try adjusting your search criteria or category filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
