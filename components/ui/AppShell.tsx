"use client";

import React, { useState } from "react";
import Logo from "./Logo";
import NavLink from "./NavLink";
import ThemeToggle from "./ThemeToggle";

export interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

// AppShell: The main signed-in layout for student, instructor and admin portals.
// Features a collapsible sleek sidebar, user avatar with initials, and theme toggle.
export default function AppShell({
  roleLabel,
  userName,
  links,
  children,
}: {
  roleLabel: string;
  userName: string;
  links: NavItem[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Extract user initials
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-bg text-main md:flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-surface transition-all duration-300 ${
          collapsed ? "w-20" : "w-64 shrink-0"
        }`}
      >
        {/* Top brand header & collapse toggle */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/40">
          <Logo compact={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-main"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Role label */}
        {!collapsed && (
          <div className="px-5 pt-4 pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
              {roleLabel} Portal
            </span>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 p-3">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} label={collapsed ? "" : l.label} exact={l.exact} />
          ))}
        </nav>

        {/* User profile & actions footer */}
        <div className="border-t border-border/60 p-4 space-y-3 bg-surface-2/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-semibold text-white shadow-sm">
                {initials}
              </div>
              {!collapsed && (
                <div className="truncate text-left">
                  <p className="truncate text-sm font-semibold text-main">{userName}</p>
                  <p className="text-xs text-muted capitalize">{roleLabel}</p>
                </div>
              )}
            </div>
            {!collapsed && <ThemeToggle />}
          </div>

          <form action="/auth/signout" method="post">
            <button
              className={`w-full rounded-xl border border-border bg-surface text-xs font-semibold text-muted transition hover:border-danger/40 hover:bg-danger/10 hover:text-danger ${
                collapsed ? "p-2 text-center" : "px-3 py-2 text-left"
              }`}
            >
              {collapsed ? "Out" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile top navigation with glass/blur backdrop */}
        <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/85 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action="/auth/signout" method="post">
                <button className="text-xs font-semibold text-muted hover:text-danger">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} exact={l.exact} compact />
            ))}
          </nav>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 px-4 py-6 md:px-10 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
