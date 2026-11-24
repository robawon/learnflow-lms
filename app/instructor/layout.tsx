import AppShell from "@/components/ui/AppShell";
import { createClient } from "@/lib/supabase/server";

// Layout for every page under /instructor: the water-themed sidebar with the instructor menu.
export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

  return (
    <AppShell
      roleLabel="Instructor"
      userName={profile?.full_name ?? ""}
      links={[
        { href: "/instructor", label: "My courses", exact: true },
        { href: "/instructor/courses/new", label: "New course" },
      ]}
    >
      {children}
    </AppShell>
  );
}
