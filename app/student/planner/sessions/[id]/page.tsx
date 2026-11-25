import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import StatusBadge from "@/components/ui/StatusBadge";
import GlowButton from "@/components/ui/GlowButton";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, isEmbeddable } from "@/lib/utils";
import {
  attachCourseMaterial,
  deleteSession,
  detachMaterial,
  finishSession,
  uploadPersonalMaterial,
} from "@/modules/planner/actions";
import SessionTimer from "@/modules/planner/components/SessionTimer";

interface SessionDetail {
  id: string;
  title: string;
  planned_start: string;
  planned_minutes: number;
  status: string;
  actual_minutes: number | null;
  notes: string | null;
  method_reason: string | null;
  courses: { title: string } | null;
  study_methods: { name: string; description: string; steps: string[] } | null;
}

interface AttachmentRow {
  id: string;
  materials: { title: string; file_path: string; file_type: string | null } | null;
  personal_materials: { title: string; file_path: string; file_type: string | null } | null;
}

// The study session room: Circular animated timer, material viewer side-by-side on large screens,
// method instructions, notes, and celebratory completion flow
export default async function SessionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { msg?: string; error?: string; view?: string };
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from("study_sessions")
    .select("id,title,planned_start,planned_minutes,status,actual_minutes,notes,method_reason,course_id,courses(title),study_methods(name,description,steps)")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const session = data as unknown as SessionDetail & { course_id: string | null };

  const { data: attachData } = await supabase
    .from("session_materials")
    .select("id,materials(title,file_path,file_type),personal_materials(title,file_path,file_type)")
    .eq("session_id", params.id);

  const attachments = await Promise.all(
    ((attachData ?? []) as unknown as AttachmentRow[]).map(async (a) => {
      const file = a.materials ?? a.personal_materials;
      const bucket = a.materials ? "course-materials" : "personal-materials";
      const signed = file ? await supabase.storage.from(bucket).createSignedUrl(file.file_path, 3600) : null;
      return {
        id: a.id,
        title: file?.title ?? "File",
        kind: a.materials ? "Course material" : "My upload",
        fileType: file?.file_type ?? null,
        path: file?.file_path ?? "",
        url: signed?.data?.signedUrl ?? null,
      };
    })
  );

  const viewing =
    attachments.find((a) => a.id === searchParams.view) ??
    attachments.find((a) => a.url && isEmbeddable(a.fileType, a.path));

  const { data: courseMaterials } = session.course_id
    ? await supabase.from("materials").select("id,title").eq("course_id", session.course_id)
    : { data: [] as { id: string; title: string }[] };

  const { data: attachedRows } = await supabase
    .from("session_materials")
    .select("material_id")
    .eq("session_id", params.id);

  const attachedMaterialIds = new Set((attachedRows ?? []).map((r) => r.material_id).filter(Boolean));
  const available = (courseMaterials ?? []).filter((m) => !attachedMaterialIds.has(m.id));

  const open = session.status === "planned" || session.status === "in_progress";

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href="/student/planner"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-main"
      >
        &larr; Back to Study Planner
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            {session.courses?.title || "Focus Room"}
          </p>
          <h1 className="font-serif text-3xl font-bold text-main mt-1">
            {session.title}
          </h1>
          <p className="text-sm text-muted mt-1.5">
            {formatDateTime(session.planned_start)} &middot; {session.planned_minutes} minutes target
          </p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {/* Two Column Layout: Study Timer Room on Left, Material Viewer on Right */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Timer & Method Instructions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Timer Card */}
          {open ? (
            <form action={finishSession} className="card space-y-5 border-primary/30">
              <h2 className="font-serif text-xl font-bold text-main text-center">
                Focus Session Timer
              </h2>
              <input type="hidden" name="session_id" value={session.id} />
              
              <SessionTimer plannedMinutes={session.planned_minutes} />

              <div className="border-t border-border pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Session Reflection Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Key concepts grasped, formulas noted, or questions for next time..."
                    className="input"
                    defaultValue={session.notes ?? ""}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Session Outcome
                    </label>
                    <select name="outcome" defaultValue="completed" className="input">
                      <option value="completed">Completed target objective</option>
                      <option value="partial">Partially accomplished</option>
                    </select>
                  </div>

                  {session.study_methods && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                        Method Rating (1 - 5)
                      </label>
                      <select name="rating" defaultValue="" className="input">
                        <option value="">No rating</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} ★
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <GlowButton variant="traffic" size="lg" className="w-full">
                    <span>Finish & Record Session</span>
                    <span aria-hidden="true">&rarr;</span>
                  </GlowButton>
                </div>
              </div>
            </form>
          ) : (
            <div className="card space-y-3 border-success/30 bg-success-subtle/20">
              <div className="flex items-center gap-2 text-success font-serif text-xl font-bold">
                <span>✓</span>
                <span>Session Completed</span>
              </div>
              <p className="text-sm text-main">
                Completed <strong>{session.actual_minutes ?? session.planned_minutes}</strong> of {session.planned_minutes} minutes planned.
              </p>
              {session.notes && (
                <div className="rounded-xl bg-surface p-4 text-sm text-muted whitespace-pre-wrap border border-border">
                  {session.notes}
                </div>
              )}
            </div>
          )}

          {/* Study Method Explanation */}
          {session.study_methods && (
            <section className="card space-y-3">
              <h2 className="font-serif text-lg font-bold text-main">
                Method Guide: {session.study_methods.name}
              </h2>
              <p className="text-sm text-muted">{session.study_methods.description}</p>
              {session.method_reason && (
                <div className="rounded-xl border border-primary/20 bg-primary-subtle p-3 text-xs text-primary font-medium">
                  <strong>Why chosen: </strong>
                  {session.method_reason}
                </div>
              )}
              <ol className="list-decimal pl-5 text-xs text-muted space-y-1.5">
                {session.study_methods.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Right Column: Material Viewer & Attachments */}
        <div className="lg:col-span-6 space-y-6">
          <section className="card space-y-4">
            <h2 className="font-serif text-xl font-bold text-main">Study Materials</h2>

            <ul className="space-y-2 text-sm">
              {attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 p-3"
                >
                  <div>
                    <p className="font-medium text-main">{a.title}</p>
                    <p className="text-[11px] text-muted">{a.kind}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.url && isEmbeddable(a.fileType, a.path) && (
                      <Link
                        href={`/student/planner/sessions/${session.id}?view=${a.id}`}
                        className="font-semibold text-xs text-primary hover:underline"
                      >
                        Preview here
                      </Link>
                    )}
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-xs text-accent hover:underline"
                      >
                        Open tab ↗
                      </a>
                    )}
                    {open && (
                      <form action={detachMaterial}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="session_id" value={session.id} />
                        <button className="text-xs text-danger hover:underline">Detach</button>
                      </form>
                    )}
                  </div>
                </li>
              ))}

              {attachments.length === 0 && (
                <li className="text-xs text-muted py-2">
                  No materials attached. Upload notes or attach course readings below.
                </li>
              )}
            </ul>

            {/* Embedded in-page preview */}
            {viewing?.url && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Viewing: {viewing.title}
                </p>
                {viewing.fileType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewing.url}
                    alt={viewing.title}
                    className="max-h-[500px] w-full rounded-xl border border-border object-contain bg-surface-2"
                  />
                ) : (
                  <iframe
                    src={viewing.url}
                    title={viewing.title}
                    className="h-[500px] w-full rounded-xl border border-border bg-white"
                  />
                )}
              </div>
            )}

            {/* Attachments Upload Actions */}
            {open && (
              <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
                <form action={uploadPersonalMaterial} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Upload Notes
                  </p>
                  <input type="hidden" name="session_id" value={session.id} />
                  <input name="title" placeholder="Notes title" className="input text-xs" />
                  <input name="file" type="file" required className="text-xs text-muted w-full" />
                  <button className="btn-ghost text-xs w-full">Upload file</button>
                </form>

                {available.length > 0 && (
                  <form action={attachCourseMaterial} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Attach Course File
                    </p>
                    <input type="hidden" name="session_id" value={session.id} />
                    <select name="material_id" className="input text-xs">
                      {available.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                    <button className="btn-ghost text-xs w-full">Attach course file</button>
                  </form>
                )}
              </div>
            )}
          </section>

          {/* Delete Action */}
          <div className="text-right">
            <form action={deleteSession}>
              <input type="hidden" name="id" value={session.id} />
              <button className="btn-danger text-xs">
                Delete this study session
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
