"use client";

// Shows toast-style feedback messages for success or error notices
export default function Flash({ msg, error }: { msg?: string; error?: string }) {
  if (!msg && !error) return null;

  return (
    <div className="space-y-2 animate-fade-in-up">
      {msg && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-subtle p-3.5 text-sm font-medium text-success shadow-sm">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{msg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-subtle p-3.5 text-sm font-medium text-danger shadow-sm">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
