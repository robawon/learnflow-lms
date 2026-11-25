"use client";

import { useEffect, useState } from "react";

// CountUp: Animates a number counting up from 0 to value on page mount.
export function CountUp({
  value,
  duration = 1200,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Smooth ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrent(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {current.toLocaleString()}
      {suffix}
    </span>
  );
}

// ProgressRing: Circular animated SVG progress ring with gradient stroke
export function ProgressRing({
  percentage,
  size = 64,
  strokeWidth = 6,
  className = "",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-border"
        />
        {/* Filled animated bar */}
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
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-main">{Math.round(percentage)}%</span>
    </div>
  );
}

// ConfettiBurst: Lightweight canvas-free confetti burst effect for celebration
export function ConfettiBurst({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number }>>([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ["#0a66c2", "#7a5233", "#16a34a", "#f59e0b", "#4da3ff", "#c89b6d"];
    const newParticles = Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.7) * 200,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
    }));
    setParticles(newParticles);
    const timeout = setTimeout(() => setParticles([]), 1400);
    return () => clearTimeout(timeout);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-sm animate-ping"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `translate(${p.x}px, ${p.y}px)`,
            transition: "all 1s cubic-bezier(0.1, 1, 0.1, 1)",
          }}
        />
      ))}
    </div>
  );
}
