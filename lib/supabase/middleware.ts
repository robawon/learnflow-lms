import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the user's login session on every request and returns the current user.
// Returns the response (with updated cookies), the user (or null) and the Supabase client.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Reads cookies from the incoming request.
        getAll() {
          return request.cookies.getAll();
        },
        // Saves refreshed session cookies on both the request and the new response.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Asks Supabase who is logged in (this also validates the session token).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
