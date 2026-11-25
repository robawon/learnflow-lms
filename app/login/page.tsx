"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/ui/AuthCard";
import Flash from "@/components/ui/Flash";
import GlowButton from "@/components/ui/GlowButton";
import { login } from "@/modules/lms/actions/auth";

// Login page: split screen with students hero on left and modern credentials card on right.
// Includes password visibility eye toggle and GlowButton for interactive pointer glow.
export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account to continue your learning journey."
      footerText="Don't have an account yet?"
      footerLinkText="Create account"
      footerLinkHref="/register"
    >
      <Flash error={searchParams.error} />

      <form action={login} className="mt-4 space-y-4">
        {/* Email input with leading icon */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              name="email"
              type="email"
              placeholder="student@learnflow.edu"
              required
              className="input pl-10"
            />
          </div>
        </div>

        {/* Password input with leading lock & eye toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted">
              Password
            </label>
            <span className="text-xs text-muted hover:text-primary cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              required
              className="input pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-main"
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Glow button: Sign in -> */}
        <div className="pt-2">
          <GlowButton variant="accent" size="lg" className="w-full">
            <span>Sign in</span>
            <span aria-hidden="true">&rarr;</span>
          </GlowButton>
        </div>
      </form>
    </AuthCard>
  );
}
