import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Router page: looks up the logged-in user's role and sends them to their own area
// (/student, /instructor or /admin). Users who are not logged in go to /login.
export default async function DashboardRouter() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  redirect(`/${profile?.role ?? "student"}`);
}
