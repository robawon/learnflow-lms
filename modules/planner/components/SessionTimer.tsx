"use client";
import { useEffect, useState } from "react";

// The study timer shown inside a session's "finish" form.
// The student can start, pause and reset it while studying. When they finish,
// the minutes studied (from the timer, or typed in by hand) are sent with the form
// in the "actual_minutes" field.
export default function SessionTimer({ plannedMinutes }: { plannedMinutes: number }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [override, setOverride] = useState<string | null>(null);

  // Adds one second every second while the timer is running.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const percent = Math.min(100, Math.round((seconds / 60 / plannedMinutes) * 100));
  const minutes = override ?? String(Math.round(seconds / 60));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <p className="font-mono text-4xl font-semibold text-water-800">{mm}:{ss}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setRunning((r) => !r)} className="btn">
            {running ? "Pause" : seconds > 0 ? "Resume" : "Start"}
          </button>
          <button type="button" onClick={() => { setRunning(false); setSeconds(0); setOverride(null); }} className="btn-ghost">
            Reset
          </button>
        </div>
      </div>
      <div className="h-2 rounded-full bg-water-100">
        <div className="h-2 rounded-full bg-water-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-slate-500">Planned: {plannedMinutes} min</p>
      <label className="block text-sm font-medium">Minutes studied
        <input
          name="actual_minutes"
          type="number"
          min={0}
          value={minutes}
          onChange={(e) => setOverride(e.target.value)}
          className="input mt-1 w-32"
        />
      </label>
    </div>
  );
}
