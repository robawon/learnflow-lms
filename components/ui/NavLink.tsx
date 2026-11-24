"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// A navigation link that highlights itself when its page is open.
// "exact" links (like a dashboard) only highlight on the exact path;
// others also highlight on sub-pages. "compact" gives the small horizontal style used on phones.
export default function NavLink({
  href,
  label,
  exact = false,
  compact = false,
}: {
  href: string;
  label: string;
  exact?: boolean;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const base = compact
    ? "whitespace-nowrap rounded-full px-3 py-1.5 text-sm"
    : "block rounded-lg px-3 py-2 text-sm font-medium";
  const state = active
    ? "bg-water-100 text-water-800"
    : "text-slate-600 hover:bg-water-50 hover:text-water-700";

  return (
    <Link href={href} className={`${base} ${state}`}>
      {label}
    </Link>
  );
}
