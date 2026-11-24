// Colours for each known status word.
const COLOURS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  submitted: "bg-water-100 text-water-800",
  graded: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-700",
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-200 text-slate-600",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-700",
  planned: "bg-water-100 text-water-800",
  completed: "bg-emerald-100 text-emerald-800",
  partial: "bg-amber-100 text-amber-800",
  missed: "bg-red-100 text-red-700",
  rescheduled: "bg-slate-100 text-slate-600",
};

// A small rounded label that shows a status (for example "published" or "overdue").
export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${COLOURS[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}
