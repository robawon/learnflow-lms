import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { StudyMethod, StudyMethodRule } from "@/lib/types";
import { suggestMethods, type SuggesterInput } from "@/modules/planner/suggester";

// POST /api/suggest
// Receives the student's situation as JSON, loads the methods and rules from the database,
// runs the suggester and returns the ranked suggestions. Only logged-in users may call it.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Reads and minimally validates the request body.
  const input = (await req.json()) as SuggesterInput;
  if (!input || typeof input.sessionMinutes !== "number") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Loads the method catalog and the rules in parallel.
  const [methods, rules] = await Promise.all([
    supabase.from("study_methods").select("*"),
    supabase.from("study_method_rules").select("*"),
  ]);
  if (methods.error || rules.error) {
    return NextResponse.json({ error: "Could not load methods" }, { status: 500 });
  }

  // Runs the rule engine and returns its result.
  const suggestions = suggestMethods(input, rules.data as StudyMethodRule[], methods.data as StudyMethod[]);
  return NextResponse.json({ suggestions });
}
