import Link from "next/link";
import Logo from "./Logo";
import { createClient } from "@/lib/supabase/server";

// The top bar for public pages (home, catalog, course details).
// Shows "Dashboard" for signed-in users and "Log in / Get started" for visitors.
export default async function PublicNav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Logo />
      <nav className="flex items-center gap-2">
        <Link href="/courses" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-water-700">Courses</Link>
        {user ? (
          <Link href="/dashboard" className="btn">Dashboard</Link>
        ) : (
          <>
            <Link href="/login" className="btn-ghost">Log in</Link>
            <Link href="/register" className="btn">Get started</Link>
          </>
        )}
      </nav>
    </header>
  );
}
