import AppShell from "@/components/ui/AppShell";
import { createClient } from "@/lib/supabase/server";

// Layout for every page under /student: the water-themed sidebar with the student menu.
// The Study Planner entries belong to the planner module.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

  return (
    <AppShell
      roleLabel="Student"
      userName={profile?.full_name ?? ""}
      links={[
        { href: "/student", label: "Dashboard", exact: true },
        { href: "/student/courses", label: "My courses" },
        { href: "/student/assignments", label: "Assignments" },
        { href: "/student/planner", label: "Study Planner", exact: true },
        { href: "/student/planner/new", label: "Plan a session" },
        { href: "/student/planner/methods", label: "Study methods" },
        { href: "/courses", label: "Course catalog" },
      ]}
    >
      {children}
    </AppShell>
  );
}
