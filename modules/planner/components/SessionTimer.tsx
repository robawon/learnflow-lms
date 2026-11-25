"use client";

import { useEffect, useState } from "react";
import GlowButton from "@/components/ui/GlowButton";

// SessionTimer: Circular animated timer ring in the study room that pulses while active
export default function SessionTimer({ plannedMinutes }: { plannedMinutes: number }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [override, setOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const percent = Math.min(100, Math.round((seconds / 60 / plannedMinutes) * 100));
  const minutes = override ?? String(Math.round(seconds / 60));

  // Circular timer constants
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      {/* Circular Animated Ring */}
      <div className={`relative flex items-center justify-center ${running ? "animate-pulse" : ""}`}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="text-primary transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute text-center">
          <p className="font-mono text-4xl font-extrabold tracking-tight text-main">
            {mm}:{ss}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted mt-1">
            {running ? "Focus Active" : seconds > 0 ? "Paused" : "Ready"}
          </p>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-3">
        <GlowButton
          type="button"
          onClick={() => setRunning((r) => !r)}
          variant={running ? "ghost" : "primary"}
          size="md"
        >
          {running ? "Pause Timer" : seconds > 0 ? "Resume Timer" : "Start Focus Timer"}
        </GlowButton>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setSeconds(0);
            setOverride(null);
          }}
          className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted hover:text-main"
        >
          Reset
        </button>
      </div>

      {/* Progress & Minutes Input */}
      <div className="w-full max-w-xs space-y-2 text-center">
        <p className="text-xs text-muted">
          Target Duration: <strong>{plannedMinutes} minutes</strong> ({percent}% reached)
        </p>

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted pt-2">
          Actual Minutes Studied
          <input
            name="actual_minutes"
            type="number"
            min={0}
            value={minutes}
            onChange={(e) => setOverride(e.target.value)}
            className="input mt-1.5 text-center font-bold text-base"
          />
        </label>
      </div>
    </div>
  );
}
