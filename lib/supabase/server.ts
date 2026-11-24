import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Creates a Supabase client for server code (server components, server actions, API routes).
// It stores the login session in cookies so the server knows who the user is.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Reads all cookies from the incoming request.
        getAll() {
          return cookieStore.getAll();
        },
        // Writes refreshed session cookies back to the response.
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component: safe to ignore, middleware refreshes the session.
          }
        },
      },
    }
  );
}
