"use client";
import { useState } from "react";
import type { Suggestion } from "@/lib/suggester";

// Interactive form for the study method suggester.
// The student describes their situation, the form calls /api/suggest,
// and the recommended methods are shown with the reasons and session steps.
export default function SuggesterForm() {
  // Form field values (with sensible defaults).
  const [courseKind, setCourseKind] = useState("theory");
  const [assessment, setAssessment] = useState("quiz");
  const [daysLeft, setDaysLeft] = useState(5);
  const [confidence, setConfidence] = useState(3);
  const [lastQuizScore, setLastQuizScore] = useState<string>("");
  const [sessionMinutes, setSessionMinutes] = useState(60);
  // Results returned by the API, and an error message if the call fails.
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState("");

  // Sends the form values to /api/suggest and stores the returned suggestions.
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseKind,
        assessment,
        daysLeft: assessment === "none" ? null : daysLeft,
        confidence,
        lastQuizScore: lastQuizScore === "" ? null : Number(lastQuizScore),
        sessionMinutes,
      }),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error ?? "Something went wrong");
    setResults(json.suggestions);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left column: the input form */}
      <form onSubmit={submit} className="card space-y-3">
        <label className="block text-sm">Course type
          <select className="input mt-1" value={courseKind} onChange={(e) => setCourseKind(e.target.value)}>
            <option value="theory">Theory</option>
            <option value="problem_solving">Problem solving</option>
            <option value="programming">Programming</option>
            <option value="writing">Writing / project</option>
          </select>
        </label>
        <label className="block text-sm">Upcoming assessment
          <select className="input mt-1" value={assessment} onChange={(e) => setAssessment(e.target.value)}>
            <option value="none">None</option>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final exam</option>
          </select>
        </label>
        {assessment !== "none" && (
          <label className="block text-sm">Days left
            <input type="number" min={0} className="input mt-1" value={daysLeft} onChange={(e) => setDaysLeft(Number(e.target.value))} />
          </label>
        )}
        <label className="block text-sm">Confidence in the topic (1-5)
          <input type="range" min={1} max={5} className="w-full" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} />
          <span className="text-xs text-slate-500">{confidence}</span>
        </label>
        <label className="block text-sm">Last quiz score % (optional)
          <input type="number" min={0} max={100} className="input mt-1" value={lastQuizScore} onChange={(e) => setLastQuizScore(e.target.value)} />
        </label>
        <label className="block text-sm">Session length (minutes)
          <input type="number" min={10} step={5} className="input mt-1" value={sessionMinutes} onChange={(e) => setSessionMinutes(Number(e.target.value))} />
        </label>
        <button className="btn">Suggest a method</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Right column: the suggestions, best match first */}
      <div className="space-y-3">
        {results?.map((s, idx) => (
          <div key={s.method.id} className="card">
            <p className="text-xs text-slate-500">{idx === 0 ? "Best match" : `Option ${idx + 1}`}</p>
            <h3 className="font-semibold">{s.method.name}</h3>
            <p className="text-sm text-slate-600">{s.method.description}</p>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-indigo-600">Why this method?</summary>
              <ul className="mt-1 list-disc pl-5">{s.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </details>
            <ol className="mt-2 list-decimal pl-5 text-sm">{s.method.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
          </div>
        ))}
        {!results && <p className="text-sm text-slate-500">Results will appear here.</p>}
      </div>
    </div>
  );
}
