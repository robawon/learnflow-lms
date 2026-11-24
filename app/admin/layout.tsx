import AppShell from "@/components/ui/AppShell";
import { createClient } from "@/lib/supabase/server";

// Layout for every page under /admin: the water-themed sidebar with the administrator menu.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

  return (
    <AppShell
      roleLabel="Administrator"
      userName={profile?.full_name ?? ""}
      links={[
        { href: "/admin", label: "Users", exact: true },
        { href: "/admin/courses", label: "Courses" },
      ]}
    >
      {children}
    </AppShell>
  );
}
