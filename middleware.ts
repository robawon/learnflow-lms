import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Maps each protected area of the site to the one role allowed to open it.
const AREAS: Record<string, string> = {
  "/student": "student",
  "/instructor": "instructor",
  "/admin": "admin",
};

// Runs before every page request. It:
//  1. sends logged-out users to /login when they open a protected page,
//  2. blocks suspended accounts,
//  3. sends users to /dashboard if they open an area that is not for their role.
export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Finds which protected area (if any) the current path belongs to.
  const area = Object.keys(AREAS).find((p) => path === p || path.startsWith(p + "/"));
  const needsLogin = area || path === "/dashboard";

  if (needsLogin && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (area && user) {
    // Loads the user's role and status from the profiles table.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .single();

    if (!profile || profile.status === "suspended") {
      return NextResponse.redirect(new URL("/login?error=Account%20unavailable", request.url));
    }
    if (profile.role !== AREAS[area]) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

// Tells Next.js to run the middleware on every route except static files and images.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
