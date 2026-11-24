import Link from "next/link";

// Top navigation bar shared by the student, instructor and admin areas.
// Shows the area title, a list of links and a sign-out button.
export default function AreaNav({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold">{title}</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-indigo-600">
              {l.label}
            </Link>
          ))}
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn-ghost">Sign out</button>
        </form>
      </div>
    </header>
  );
}
