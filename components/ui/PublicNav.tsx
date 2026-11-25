import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { createClient } from "@/lib/supabase/server";

// Public navigation header inspired by Reference 1 (LinkedIn Learning):
// Clean top bar, inline search field, outlined "Sign in" pill, filled "Get started" CTA, and ThemeToggle.
export default async function PublicNav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        {/* Left: Brand logo */}
        <div className="flex items-center gap-8">
          <Logo />

          {/* Quick search input (submits to /courses?q=) */}
          <form
            action="/courses"
            method="get"
            className="hidden md:flex relative items-center"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              name="q"
              placeholder="Search skills, topics, or subjects..."
              className="h-10 w-72 rounded-full border border-border bg-surface-2 pl-9 pr-4 text-xs text-main placeholder-muted transition-all duration-150 focus:w-80 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>

        {/* Right side navigation links and actions */}
        <nav className="flex items-center gap-3">
          <Link
            href="/courses"
            className="hidden sm:inline-flex rounded-full px-3.5 py-1.5 text-sm font-medium text-muted hover:text-main transition"
          >
            Explore Courses
          </Link>

          <ThemeToggle />

          {user ? (
            <Link href="/dashboard" className="btn">
              Go to Dashboard &rarr;
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-full border border-border bg-transparent px-4 py-2 text-sm font-semibold text-main transition hover:border-primary hover:text-primary hover:bg-surface-2"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn"
              >
                Get started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
