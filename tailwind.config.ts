import type { Config } from "tailwindcss";

// Tailwind configuration for LearnFlow LMS.
// Uses semantic tokens driven by CSS variables with support for class-based dark mode.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds & surfaces
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        
        // Typography
        main: "var(--color-text)",
        muted: "var(--color-muted)",
        
        // Brand & Accents
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          subtle: "var(--color-primary-subtle)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          subtle: "var(--color-accent-subtle)",
        },
        
        // Borders & Dividers
        border: "var(--color-border)",
        "border-subtle": "var(--color-border-subtle)",
        
        // Traffic light status & urgency indicators
        success: {
          DEFAULT: "var(--color-success)",
          subtle: "var(--color-success-subtle)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          subtle: "var(--color-warning-subtle)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          subtle: "var(--color-danger-subtle)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Fraunces", "Playfair Display", "Georgia", "Cambria", "serif"],
      },
      boxShadow: {
        glow: "0 0 20px -3px rgba(10, 102, 194, 0.35)",
        "glow-accent": "0 0 25px -4px rgba(122, 82, 51, 0.35)",
        "glow-traffic": "0 0 25px -4px rgba(245, 158, 11, 0.45)",
        card: "0 4px 20px -2px rgba(23, 18, 14, 0.05)",
        "card-hover": "0 12px 30px -4px rgba(23, 18, 14, 0.12)",
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "float-delayed": "float 7s ease-in-out 2s infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.05)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
