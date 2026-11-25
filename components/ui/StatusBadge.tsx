// StatusBadge: Modern pill badge with traffic light status styling and crisp contrast
const BADGE_STYLES: Record<string, string> = {
  // Urgency / traffic lights
  pending: "bg-warning-subtle text-warning border border-warning/30",
  submitted: "bg-primary-subtle text-primary border border-primary/30",
  graded: "bg-success-subtle text-success border border-success/30",
  overdue: "bg-danger-subtle text-danger border border-danger/30 font-bold",
  draft: "bg-surface-2 text-muted border border-border",
  published: "bg-success-subtle text-success border border-success/30",
  archived: "bg-surface-2 text-muted border border-border",
  active: "bg-success-subtle text-success border border-success/30",
  suspended: "bg-danger-subtle text-danger border border-danger/30",
  planned: "bg-primary-subtle text-primary border border-primary/30",
  completed: "bg-success-subtle text-success border border-success/30",
  partial: "bg-warning-subtle text-warning border border-warning/30",
  missed: "bg-danger-subtle text-danger border border-danger/30 font-bold animate-pulse",
  rescheduled: "bg-surface-2 text-accent border border-accent/30",
};

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: string;
  size?: "sm" | "md";
}) {
  const normalized = status.toLowerCase();
  const styling = BADGE_STYLES[normalized] ?? "bg-surface-2 text-main border border-border";
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider ${sizeClass} ${styling}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
