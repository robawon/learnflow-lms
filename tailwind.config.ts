import type { Config } from "tailwindcss";

// Tailwind configuration.
// "water" is the platform's colour palette: clean whites with soft aqua-blue accents.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./modules/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        water: {
          50: "#f2fbff",
          100: "#e0f4fc",
          200: "#bfe8f8",
          300: "#8fd6f0",
          400: "#4fbde6",
          500: "#1ea3d4",
          600: "#1485b3",
          700: "#146a8f",
          800: "#165874",
          900: "#164a61",
        },
      },
    },
  },
  plugins: [],
};
export default config;
