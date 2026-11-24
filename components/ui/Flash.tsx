// Shows a green success message and/or a red error message at the top of a page.
// The messages travel in the URL (?msg=... and ?error=...) after a form is submitted.
export default function Flash({ msg, error }: { msg?: string; error?: string }) {
  return (
    <>
      {msg && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </>
  );
}
