"use client";

import React, { useRef } from "react";

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "traffic" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

// GlowButton: Cursor-following radial light and glowing perimeter border.
// Tracks pointer position using CSS variables --mx and --my.
// Supports server actions and regular form submit behaviors natively.
export default function GlowButton({
  variant = "primary",
  size = "md",
  children,
  className = "",
  onPointerMove,
  ...props
}: GlowButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      buttonRef.current.style.setProperty("--mx", `${x}px`);
      buttonRef.current.style.setProperty("--my", `${y}px`);
    }
    if (onPointerMove) onPointerMove(e);
  };

  const sizeClasses = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base font-semibold",
  }[size];

  // Colors for each glow variant
  const variantStyles = {
    primary:
      "bg-primary text-white hover:bg-primary-hover shadow-glow border-primary/30",
    accent:
      "bg-accent text-white hover:bg-accent-hover shadow-glow-accent border-accent/40",
    traffic:
      "bg-[#1b1714] dark:bg-[#120e0b] text-white border-amber-500/50 shadow-glow-traffic ring-1 ring-amber-400/40",
    ghost:
      "bg-surface text-main border-border hover:border-primary/50 hover:bg-surface-2",
  }[variant];

  // Glow halo gradient depending on chosen variant
  const glowGradients = {
    primary:
      "radial-gradient(circle 80px at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.25), transparent 80%)",
    accent:
      "radial-gradient(circle 85px at var(--mx, 50%) var(--my, 50%), rgba(200, 155, 109, 0.35), transparent 80%)",
    traffic:
      "radial-gradient(circle 90px at var(--mx, 50%) var(--my, 50%), rgba(245, 158, 11, 0.4), rgba(22, 163, 74, 0.2) 60%, transparent 80%)",
    ghost:
      "radial-gradient(circle 70px at var(--mx, 50%) var(--my, 50%), rgba(10, 102, 194, 0.12), transparent 80%)",
  }[variant];

  return (
    <button
      ref={buttonRef}
      onPointerMove={handlePointerMove}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantStyles} ${className}`}
      {...props}
    >
      {/* Pointer follow highlight layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: glowGradients,
        }}
      />
      {/* Content wrapper with relative positioning to stay above glow */}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
