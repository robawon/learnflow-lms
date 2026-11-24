// A soft water-wave divider used at the bottom of hero sections. Fills with the page's white.
export default function Wave({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <path
        fill="#ffffff"
        d="M0,64 C240,120 480,0 720,48 C960,96 1200,112 1440,40 L1440,120 L0,120 Z"
      />
    </svg>
  );
}
