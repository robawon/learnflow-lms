import React from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  notice?: string;
}

// Split-screen Auth layout inspired by Reference 2 (BunaQR staff portal).
// Left panel: Dark espresso backdrop, glowing animated corner, students photo with gradient ring,
// floating dynamic badges, serif headline, and branding.
// Right panel: Cream / dark surface with rounded card, serif header, leading icons, ThemeToggle, and EN/Amharic indicator.
export default function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
  notice,
}: AuthCardProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-bg text-main selection:bg-primary/20">
      {/* Left panel: Espresso brown hero container (hidden on mobile) */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#17120e] p-12 text-[#f3ebe3]">
        {/* Subtle warm animated corner glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-tr from-accent/40 via-primary/25 to-transparent blur-3xl animate-pulse-glow"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-bl from-primary/30 to-transparent blur-3xl"
        />

        {/* Top left Logo */}
        <div className="relative z-10">
          <Logo />
        </div>

        {/* Center: Students studying visual with gradient ring & floating cards */}
        <div className="relative z-10 my-auto flex flex-col items-center">
          <div className="relative">
            {/* Gradient ring */}
            <div className="relative h-72 w-72 rounded-3xl p-1 bg-gradient-to-tr from-primary via-accent to-amber-500 shadow-2xl">
              <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-[#231c16]">
                <Image
                  src="/images/students-hero.jpg"
                  alt="Students studying collaboratively"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Floating Bobbing Badges */}
            <div className="absolute -top-4 -left-10 rounded-2xl border border-white/10 bg-[#231c16]/90 p-3 shadow-xl backdrop-blur-md animate-float-slow">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 rounded-full bg-danger animate-ping" />
                <div>
                  <p className="text-[11px] font-semibold text-white/90">Next deadline</p>
                  <p className="text-xs font-bold text-amber-400">in 2 days</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-8 rounded-2xl border border-white/10 bg-[#231c16]/90 p-3.5 shadow-xl backdrop-blur-md animate-float-delayed">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  🔥
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/70">Study streak</p>
                  <p className="text-xs font-bold text-white">5 days active</p>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 -right-12 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#231c16]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400">92%</span>
                <span className="text-[11px] text-white/70">Course progress</span>
              </div>
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="mt-12 max-w-md text-left">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Learn together. <br />
              <span className="text-primary-hover">Plan smarter.</span>
            </h2>
            <p className="mt-3 text-sm text-[#b7a898] leading-relaxed">
              Experience an intelligent learning ecosystem that transforms course materials, deadlines, and study rhythms into seamless mastery.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#b7a898]">
          <p>© {new Date().getFullYear()} LearnFlow Platform</p>
          <span className="rounded-full bg-white/5 px-2.5 py-1">v2.0 Alive UI</span>
        </div>
      </div>

      {/* Right panel: Modern Card & Inputs with Theme Toggle & Language Pill */}
      <div className="relative flex flex-col justify-between p-6 sm:p-12 bg-bg">
        {/* Top bar controls */}
        <div className="flex items-center justify-between lg:justify-end gap-3 w-full">
          {/* Mobile brand header */}
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="flex items-center gap-2">
            {/* Language pill placeholder */}
            <div className="flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted">
              <span className="font-bold text-main">EN</span>
              <span className="mx-1.5 opacity-40">/</span>
              <span className="opacity-70 hover:opacity-100 cursor-pointer">አማ</span>
            </div>
            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-lg">
            <div className="mb-6">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-main tracking-tight">
                {title}
              </h1>
              {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
            </div>

            {children}

            {/* Divider */}
            <div className="my-6 border-t border-border" />

            <div className="text-center text-sm text-muted">
              {footerText}{" "}
              <Link href={footerLinkHref} className="font-semibold text-primary hover:underline">
                {footerLinkText}
              </Link>
            </div>

            {notice && (
              <p className="mt-4 text-center text-xs text-muted/75">
                {notice}
              </p>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-muted py-2">
          Protected by LearnFlow platform security.
        </div>
      </div>
    </main>
  );
}
