"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { withFlash } from "@/lib/utils";

// Server action for the login form.
// Signs the user in with email and password; on success goes to /dashboard,
// on failure returns to /login with the error message.
export async function login(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect(withFlash("/login", "error", error.message));
  redirect("/dashboard");
}

// Server action for the registration form.
// Creates a new account. The role is NOT taken from the form:
// the database trigger always creates a student, so nobody can sign up as admin.
export async function register(formData: FormData) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    options: { data: { full_name: String(formData.get("full_name")) } },
  });
  if (error) redirect(withFlash("/register", "error", error.message));
  // If email confirmation is on, there is no session yet.
  if (!data.session) redirect(withFlash("/login", "error", "Check your email to confirm your account."));
  redirect("/dashboard");
}
