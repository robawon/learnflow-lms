import Link from "next/link";

// LearnFlow modern brand logo:
// Represents continuous learning and fluid growth through a dual intertwined loop
export default function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5 transition focus:outline-none"
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-surface">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="text-primary transition-colors group-hover:text-accent"
          >
            <path
              d="M12 3L2 8.5L12 14L22 8.5L12 3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 10.7V17C6 18.5 8.7 20 12 20C15.3 20 18 18.5 18 17V10.7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M22 8.5V14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      {!compact && (
        <span className="font-serif text-xl font-bold tracking-tight text-main">
          Learn<span className="text-primary">Flow</span>
        </span>
      )}
    </Link>
  );
}
