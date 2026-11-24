import type {
  AssessmentKind,
  CourseKind,
  StudyMethod,
  StudyMethodRule,
} from "./types";

// Everything the suggester needs to know about the student's situation.
export interface SuggesterInput {
  courseKind: CourseKind;
  assessment: AssessmentKind;
  daysLeft: number | null;      // days until the assessment/deadline
  confidence: number | null;    // 1-5, student's own rating
  lastQuizScore: number | null; // 0-100
  sessionMinutes: number;       // how long the student can study
}

// One recommended method with its total score and the reasons that produced it.
export interface Suggestion {
  method: StudyMethod;
  score: number;
  reasons: string[];
}

// Checks whether a single rule applies to the student's situation.
// A rule matches only when every condition it defines holds.
// If a rule needs a value the student has not given (e.g. confidence), it does not match.
function ruleMatches(r: StudyMethodRule, i: SuggesterInput): boolean {
  if (r.course_kind !== null && r.course_kind !== i.courseKind) return false;
  if (r.assessment !== null && r.assessment !== i.assessment) return false;

  if (r.max_days_left !== null && (i.daysLeft === null || i.daysLeft > r.max_days_left)) return false;
  if (r.min_days_left !== null && (i.daysLeft === null || i.daysLeft < r.min_days_left)) return false;
  if (r.max_confidence !== null && (i.confidence === null || i.confidence > r.max_confidence)) return false;
  if (r.max_last_score !== null && (i.lastQuizScore === null || i.lastQuizScore > r.max_last_score)) return false;
  if (r.min_session_min !== null && i.sessionMinutes < r.min_session_min) return false;

  return true;
}

// Main suggester function. It:
//  1. finds every rule that matches the student's situation,
//  2. adds up the rule weights per method (collecting the reasons),
//  3. skips methods that need more time than the session allows,
//  4. returns the best `top` methods, highest score first.
// If no rule matches, it falls back to a safe general method (active recall).
export function suggestMethods(
  input: SuggesterInput,
  rules: StudyMethodRule[],
  methods: StudyMethod[],
  top = 3
): Suggestion[] {
  const byId = new Map(methods.map((m) => [m.id, m]));
  const scores = new Map<number, Suggestion>();

  for (const rule of rules) {
    if (!ruleMatches(rule, input)) continue;
    const method = byId.get(rule.method_id);
    if (!method) continue;
    // Skip methods that need more time than the student has
    if (method.min_minutes !== null && method.min_minutes > input.sessionMinutes) continue;

    const entry = scores.get(method.id) ?? { method, score: 0, reasons: [] };
    entry.score += rule.weight;
    entry.reasons.push(rule.reason);
    scores.set(method.id, entry);
  }

  const ranked = [...scores.values()].sort((a, b) => b.score - a.score).slice(0, top);
  if (ranked.length > 0) return ranked;

  // Fallback when no rule matched: a safe general-purpose choice
  const fallback = methods.find((m) => m.slug === "active-recall") ?? methods[0];
  return fallback
    ? [{ method: fallback, score: 0, reasons: ["No specific rule matched, so here is a reliable general method."] }]
    : [];
}
