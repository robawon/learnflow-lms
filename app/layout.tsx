import "./globals.css";
import type { Metadata } from "next";

// Page title and description used by browsers and search engines.
export const metadata: Metadata = {
  title: "LearnFlow: Learning Management System",
  description: "A learning management system with a built-in smart study planner",
};

// Root layout: wraps every page in the site with the <html> and <body> tags.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
