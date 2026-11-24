// Shared helper functions used by pages and server actions.

// Reads a text field from a form, trims it, and returns null when it is empty.
export function formText(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v === "" ? null : v;
}

// Replaces unsafe characters in a file name so it is valid inside a storage path.
export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Builds a URL that carries a message (?msg=...) or an error (?error=...) to show on the next page.
export function withFlash(path: string, kind: "msg" | "error", message: string): string {
  return `${path}?${kind}=${encodeURIComponent(message)}`;
}

// Formats an ISO date string as a readable local date and time, e.g. "12 Nov 2026, 14:30".
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formats an ISO date string as a short date only, e.g. "12 Nov".
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Whole days from one date to another (rounded up, never negative).
export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

// Converts a Date into the "YYYY-MM-DDTHH:mm" text that <input type="datetime-local"> expects.
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// True when a stored file can be shown directly inside the page (PDF or image).
export function isEmbeddable(fileType: string | null, path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return fileType === "application/pdf" || (fileType?.startsWith("image/") ?? false) ||
    ["pdf", "png", "jpg", "jpeg", "gif", "webp"].includes(ext);
}
