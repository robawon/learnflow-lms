import Link from "next/link";
import PublicNav from "@/components/ui/PublicNav";
import Wave from "@/components/ui/Wave";

// The features shown as cards on the home page.
const FEATURES = [
  { title: "Courses and lessons", text: "Join courses, follow modules and lessons, download materials and track your progress." },
  { title: "Assignments and grades", text: "Submit your work online, get feedback from your instructor and see your grades." },
  { title: "Smart Study Planner", text: "Turn deadlines into study sessions. The planner suggests how to study and helps you recover missed sessions." },
];

// Public home page: a water-blue hero with a wave, then the three main features.
export default function Home() {
  return (
    <div>
      <div className="bg-gradient-to-b from-water-100 via-water-50 to-white">
        <PublicNav />
        <section className="mx-auto max-w-3xl px-6 pb-24 pt-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-water-900 sm:text-5xl">Learn together. Plan smarter.</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            One place for your courses, assignments and a study planner that turns every deadline into a clear plan.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register" className="btn px-6 py-3">Get started</Link>
            <Link href="/courses" className="btn-ghost px-6 py-3">Browse courses</Link>
          </div>
        </section>
        <Wave className="block h-16 w-full" />
      </div>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-20 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card">
            <div className="mb-3 h-9 w-9 rounded-lg bg-water-100" />
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
