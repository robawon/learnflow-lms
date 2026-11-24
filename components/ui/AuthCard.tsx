import Logo from "./Logo";

// The centred white card on a water-blue background used by the login and register pages.
export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-water-100 via-water-50 to-white px-4">
      <div className="mb-6"><Logo /></div>
      <div className="card w-full max-w-sm space-y-4 p-7">
        <h1 className="text-xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
