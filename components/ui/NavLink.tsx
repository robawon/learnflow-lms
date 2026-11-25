"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// NavLink: Navigation link with active indicator and smooth hover feedback.
export default function NavLink({
  href,
  label,
  exact = false,
  compact = false,
  icon,
}: {
  href: string;
  label: string;
  exact?: boolean;
  compact?: boolean;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  if (compact) {
    return (
      <Link
        href={href}
        className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
          active
            ? "bg-primary text-white shadow-sm"
            : "border border-border bg-surface text-muted hover:border-primary/40 hover:text-main"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary/10 text-primary font-semibold shadow-sm"
          : "text-muted hover:bg-surface-2 hover:text-main"
      }`}
    >
      {/* Animated active bar on the left edge */}
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </Link>
  );
}
