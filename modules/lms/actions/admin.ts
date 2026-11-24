"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withFlash } from "@/lib/utils";

// Server action: changes a user's role (student, instructor or admin).
// Admins cannot change their own role, so the platform can never be left without an admin.
// The database also rejects this unless the caller is an admin.
export async function setUserRole(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (id === user.id) redirect(withFlash("/admin", "error", "You cannot change your own role"));
  if (!["student", "instructor", "admin"].includes(role)) redirect(withFlash("/admin", "error", "Invalid role"));

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) redirect(withFlash("/admin", "error", error.message));
  redirect(withFlash("/admin", "msg", "Role updated"));
}

// Server action: suspends or re-activates a user account. Admins cannot suspend themselves.
export async function setUserStatus(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (id === user.id) redirect(withFlash("/admin", "error", "You cannot suspend your own account"));
  if (!["active", "suspended"].includes(status)) redirect(withFlash("/admin", "error", "Invalid status"));

  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) redirect(withFlash("/admin", "error", error.message));
  redirect(withFlash("/admin", "msg", status === "suspended" ? "Account suspended" : "Account activated"));
}
