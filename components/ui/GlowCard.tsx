"use client";

import React, { useRef } from "react";

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: "blue" | "brown" | "subtle";
}

// GlowCard: An interactive container with smooth hover lift and a subtle cursor-tracking glow.
export default function GlowCard({
  children,
  className = "",
  glowColor = "blue",
  onPointerMove,
  ...props
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardRef.current.style.setProperty("--mx", `${x}px`);
      cardRef.current.style.setProperty("--my", `${y}px`);
    }
    if (onPointerMove) onPointerMove(e);
  };

  const glowStyle = {
    blue: "radial-gradient(circle 240px at var(--mx, 50%) var(--my, 50%), rgba(10, 102, 194, 0.08), transparent 80%)",
    brown: "radial-gradient(circle 240px at var(--mx, 50%) var(--my, 50%), rgba(122, 82, 51, 0.08), transparent 80%)",
    subtle: "radial-gradient(circle 200px at var(--mx, 50%) var(--my, 50%), rgba(245, 158, 11, 0.06), transparent 80%)",
  }[glowColor];

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover ${className}`}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: glowStyle,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
