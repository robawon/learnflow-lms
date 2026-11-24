import Logo from "./Logo";
import NavLink from "./NavLink";

// One entry of a sidebar menu.
export interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

// The signed-in layout shared by the student, instructor and admin areas:
// a white sidebar (a scrolling pill bar on phones) and a soft water-tinted content area.
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
  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-water-100 bg-white md:flex">
        <div className="px-5 py-5"><Logo /></div>
        <p className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-water-500">{roleLabel}</p>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} exact={l.exact} />
          ))}
        </nav>
        <div className="border-t border-water-100 p-4">
          <p className="truncate text-sm font-medium text-slate-800">{userName}</p>
          <form action="/auth/signout" method="post" className="mt-2">
            <button className="btn-ghost w-full">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar (phones) */}
        <header className="border-b border-water-100 bg-white md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Logo />
            <form action="/auth/signout" method="post">
              <button className="text-sm text-water-700">Sign out</button>
            </form>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} label={l.label} exact={l.exact} compact />
            ))}
          </nav>
        </header>

        <main className="min-h-screen bg-gradient-to-b from-water-50 to-white px-4 py-6 md:px-10 md:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
