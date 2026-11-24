import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/ui/Flash";
import StatusBadge from "@/components/ui/StatusBadge";
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

// A session with its course and method, as returned by the query below.
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

// An attached material: either a course material or a personal upload.
interface AttachmentRow {
  id: string;
  materials: { title: string; file_path: string; file_type: string | null } | null;
  personal_materials: { title: string; file_path: string; file_type: string | null } | null;
}

// The study room for one session. It shows the chosen method and why, the steps to follow,
// the attached materials (the student's own uploads and the course's materials) with an
// in-page viewer, the study timer, and the form to finish the session with notes and a rating.
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

  // Loads the attached materials and creates a temporary link (valid for 1 hour) for each.
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

  // The material shown in the viewer: the one chosen with ?view=, or the first one the browser can display.
  const viewing = attachments.find((a) => a.id === searchParams.view) ?? attachments.find((a) => a.url && isEmbeddable(a.fileType, a.path));

  // Course materials that are not attached yet, so the student can attach them.
  const { data: courseMaterials } = session.course_id
    ? await supabase.from("materials").select("id,title").eq("course_id", session.course_id)
    : { data: [] as { id: string; title: string }[] };
  const { data: attachedRows } = await supabase.from("session_materials").select("material_id").eq("session_id", params.id);
  const attachedMaterialIds = new Set((attachedRows ?? []).map((r) => r.material_id).filter(Boolean));
  const available = (courseMaterials ?? []).filter((m) => !attachedMaterialIds.has(m.id));

  const open = session.status === "planned" || session.status === "in_progress";

  return (
    <div className="space-y-6">
      <Link href="/student/planner" className="text-sm font-medium text-water-700">&larr; Study Planner</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-water-600">{session.courses?.title}</p>
          <h1 className="text-2xl font-semibold">{session.title}</h1>
          <p className="text-sm text-slate-500">{formatDateTime(session.planned_start)} &middot; {session.planned_minutes} min</p>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <Flash msg={searchParams.msg} error={searchParams.error} />

      {/* Chosen method and why */}
      {session.study_methods && (
        <section className="card space-y-2">
          <h2 className="font-semibold">Study method: {session.study_methods.name}</h2>
          <p className="text-sm text-slate-600">{session.study_methods.description}</p>
          {session.method_reason && (
            <p className="rounded-lg bg-water-50 p-3 text-sm"><span className="font-medium">Why this method? </span>{session.method_reason}</p>
          )}
          <ol className="list-decimal pl-5 text-sm">{session.study_methods.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}

      {/* Study material: attached files and in-page viewer */}
      <section className="card space-y-4">
        <h2 className="font-semibold">Study material</h2>
        <ul className="space-y-2 text-sm">
          {attachments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-water-50 px-3 py-2">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-slate-500">{a.kind}</p>
              </div>
              <div className="flex items-center gap-3">
                {a.url && isEmbeddable(a.fileType, a.path) && (
                  <Link href={`/student/planner/sessions/${session.id}?view=${a.id}`} className="font-medium text-water-700">View here</Link>
                )}
                {a.url && <a href={a.url} target="_blank" className="font-medium text-water-700">Open</a>}
                {open && (
                  <form action={detachMaterial}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="session_id" value={session.id} />
                    <button className="btn-danger">Remove</button>
                  </form>
                )}
              </div>
            </li>
          ))}
          {attachments.length === 0 && <li className="text-slate-500">No material yet. Upload your own notes or attach a course file below.</li>}
        </ul>

        {viewing?.url && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Viewing: {viewing.title}</p>
            {viewing.fileType?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewing.url} alt={viewing.title} className="max-h-[70vh] w-full rounded-lg border border-water-100 object-contain" />
            ) : (
              <iframe src={viewing.url} title={viewing.title} className="h-[70vh] w-full rounded-lg border border-water-100" />
            )}
            <p className="text-xs text-slate-500">If the file does not show, use "Open" to view it in a new tab.</p>
          </div>
        )}

        {open && (
          <div className="grid gap-4 border-t border-water-100 pt-4 md:grid-cols-2">
            <form action={uploadPersonalMaterial} className="space-y-2">
              <p className="text-sm font-medium">Upload your own material</p>
              <input type="hidden" name="session_id" value={session.id} />
              <input name="title" placeholder="Title (optional)" className="input" />
              <input name="file" type="file" required className="text-sm" />
              <button className="btn-ghost">Upload</button>
            </form>
            {available.length > 0 && (
              <form action={attachCourseMaterial} className="space-y-2">
                <p className="text-sm font-medium">Attach a course material</p>
                <input type="hidden" name="session_id" value={session.id} />
                <select name="material_id" className="input">
                  {available.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                <button className="btn-ghost">Attach</button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* Timer and finish form (only while the session is open) */}
      {open ? (
        <form action={finishSession} className="card space-y-4">
          <h2 className="font-semibold">Study timer</h2>
          <input type="hidden" name="session_id" value={session.id} />
          <SessionTimer plannedMinutes={session.planned_minutes} />
          <label className="block text-sm font-medium">Notes (private)
            <textarea name="notes" rows={3} placeholder="What did you learn? What is still unclear?" className="input mt-1" defaultValue={session.notes ?? ""} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">How did it go?
              <select name="outcome" defaultValue="completed" className="input mt-1">
                <option value="completed">I finished what I planned</option>
                <option value="partial">I only finished part of it</option>
              </select>
            </label>
            {session.study_methods && (
              <label className="block text-sm font-medium">Did the method help? (1-5)
                <select name="rating" defaultValue="" className="input mt-1">
                  <option value="">Skip</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
            )}
          </div>
          <button className="btn">Finish session</button>
        </form>
      ) : (
        <section className="card space-y-2">
          <h2 className="font-semibold">Summary</h2>
          <p className="text-sm">Studied {session.actual_minutes ?? 0} of {session.planned_minutes} minutes.</p>
          {session.notes && <p className="whitespace-pre-wrap rounded-lg bg-water-50 p-3 text-sm">{session.notes}</p>}
        </section>
      )}

      <form action={deleteSession}>
        <input type="hidden" name="id" value={session.id} />
        <button className="btn-danger">Delete this session</button>
      </form>
    </div>
  );
}
