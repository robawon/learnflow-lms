import Link from "next/link";

// The LearnFlow logo: a small water drop next to the platform name. Links to the home page.
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-water-800">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2.5c3.6 4.4 6.5 7.7 6.5 11.2a6.5 6.5 0 1 1-13 0C5.5 10.2 8.4 6.9 12 2.5Z" fill="#1ea3d4" />
        <path d="M9 14.2a3.2 3.2 0 0 0 2.6 3.1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="text-lg">LearnFlow</span>
    </Link>
  );
}
