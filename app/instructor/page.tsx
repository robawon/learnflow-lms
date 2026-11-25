import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import GlowButton from "@/components/ui/GlowButton";
import GlowCard from "@/components/ui/GlowCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";

// Instructor dashboard: Course overview with status chips, hover lift cards, and illustrated empty states
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
    <div className="space-y-8 animate-fade-in-up">
      <PageHeader
        title="Instructor Dashboard"
        subtitle="Manage your curriculum, author lessons, grade assignments, and mentor enrolled students."
        action={
          <Link href="/instructor/courses/new">
            <GlowButton variant="accent" size="sm">
              <span>+ Create New Course</span>
            </GlowButton>
          </Link>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((c) => (
          <Link key={c.id} href={`/instructor/courses/${c.id}`} className="block group">
            <GlowCard className="h-full flex flex-col justify-between border-border hover:border-accent/40">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    {c.category ?? "General"}
                  </span>
                  <StatusBadge status={c.status} size="sm" />
                </div>

                <h2 className="font-serif text-xl font-bold text-main group-hover:text-primary transition line-clamp-2">
                  {c.title}
                </h2>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold text-accent">
                <span>Edit curriculum & students</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </div>
            </GlowCard>
          </Link>
        ))}

        {courses?.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-border bg-surface p-12 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-2xl">
              🎓
            </div>
            <h3 className="font-serif text-xl font-bold text-main">No courses published yet</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              Start sharing your expertise. Create your first course to add structured modules, study readings, and assignments.
            </p>
            <Link href="/instructor/courses/new" className="inline-block pt-2">
              <GlowButton variant="accent" size="md">
                Create First Course Now
              </GlowButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
