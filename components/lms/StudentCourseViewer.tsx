"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlowButton from "@/components/ui/GlowButton";
import { ConfettiBurst } from "@/components/ui/Motion";
import type { CourseModule, Material } from "@/lib/types";
import { toggleLessonComplete } from "@/modules/lms/actions/enrollment";

// Interactive Course Viewer Client component
// Smooth accordion open/close, live animated progress bar, and celebratory confetti upon lesson completion
export default function StudentCourseViewer({
  course,
  modules,
  materials,
  initialDoneIds,
  totalLessons,
}: {
  course: { id: string; title: string; description: string | null };
  modules: CourseModule[];
  materials: Array<Material & { url: string | null }>;
  initialDoneIds: string[];
  totalLessons: number;
}) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set(initialDoneIds));
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    [modules[0]?.id || ""]: true,
  });

  const percent = totalLessons ? Math.round((doneIds.size / totalLessons) * 100) : 0;

  const toggleModuleAccordion = (modId: string) => {
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <ConfettiBurst trigger={triggerConfetti} />

      <Link
        href="/student/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-main"
      >
        &larr; Back to My Courses
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-main">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-2 text-sm text-muted max-w-2xl">{course.description}</p>
        )}
      </div>

      {/* Animated Progress Card */}
      <div className="card space-y-3 bg-gradient-to-r from-surface to-surface-2 border-border/80">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-main">Course Completion</span>
          <span className="font-serif text-lg font-bold text-primary">{percent}%</span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted">
          {doneIds.size} of {totalLessons} lessons marked complete
        </p>
      </div>

      {/* Modules & Lessons Accordion */}
      <div className="space-y-4">
        {modules.map((m) => {
          const isOpen = !!openModules[m.id];
          return (
            <div key={m.id} className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleModuleAccordion(m.id)}
                className="w-full flex items-center justify-between p-5 text-left font-serif text-lg font-bold text-main hover:bg-surface-2 transition"
              >
                <span>{m.title}</span>
                <span className={`transition-transform duration-200 text-muted ${isOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border/60 p-5 space-y-3 bg-bg/50">
                  {m.lessons.map((l) => {
                    const completed = doneIds.has(l.id);
                    return (
                      <div
                        key={l.id}
                        className={`rounded-xl border p-4 transition-all ${
                          completed
                            ? "border-success/30 bg-success-subtle/30"
                            : "border-border bg-surface"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-main text-base flex items-center gap-2">
                              {completed && <span className="text-success font-bold">✓</span>}
                              <span>{l.title}</span>
                            </h3>
                            {l.content && (
                              <p className="text-sm text-muted whitespace-pre-wrap leading-relaxed pt-1">
                                {l.content}
                              </p>
                            )}
                          </div>

                          <form
                            action={async (formData) => {
                              if (!completed) {
                                setTriggerConfetti(true);
                                setDoneIds((prev) => new Set([...prev, l.id]));
                              } else {
                                setDoneIds((prev) => {
                                  const next = new Set(prev);
                                  next.delete(l.id);
                                  return next;
                                });
                              }
                              await toggleLessonComplete(formData);
                            }}
                          >
                            <input type="hidden" name="course_id" value={course.id} />
                            <input type="hidden" name="lesson_id" value={l.id} />
                            <input type="hidden" name="completed" value={completed ? "1" : "0"} />
                            <GlowButton
                              variant={completed ? "ghost" : "primary"}
                              size="sm"
                            >
                              {completed ? "Mark not done" : "Complete Lesson ✓"}
                            </GlowButton>
                          </form>
                        </div>
                      </div>
                    );
                  })}

                  {m.lessons.length === 0 && (
                    <p className="text-sm text-muted">No lessons published in this module yet.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-muted">The instructor has not added module lessons yet.</p>
          </div>
        )}
      </div>

      {/* Course Materials */}
      {materials.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-serif text-xl font-bold text-main">Course Materials & Downloads</h2>
          <ul className="space-y-2">
            {materials.map((mat) => (
              <li
                key={mat.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-3 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📄</span>
                  <span className="font-medium text-main">{mat.title}</span>
                </div>
                {mat.url ? (
                  <a
                    href={mat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    Download &rarr;
                  </a>
                ) : (
                  <span className="text-xs text-muted">Unavailable</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
