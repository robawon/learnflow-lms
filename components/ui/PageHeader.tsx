import ThemeToggle from "./ThemeToggle";

// Modern page header with Fraunces serif title, supporting text, and action area
export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/50">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-main">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
