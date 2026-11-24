import PageHeader from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { StudyMethod } from "@/lib/types";
import SuggesterForm from "@/modules/planner/components/SuggesterForm";

// Study methods page: the method finder (try the suggester with any situation)
// and the full catalog of study methods with their steps.
export default async function MethodsPage() {
  const supabase = createClient();
  const { data } = await supabase.from("study_methods").select("*").order("name");
  const methods = (data ?? []) as StudyMethod[];

  return (
    <div className="space-y-8">
      <PageHeader title="Study methods" subtitle="Find the right method for your situation, or browse them all." />
      <SuggesterForm />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">All methods</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((m) => (
            <div key={m.id} className="card">
              <h3 className="font-semibold">{m.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{m.description}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-water-600">Best for</p>
              <p className="text-sm">{m.best_for}</p>
              <ol className="mt-2 list-decimal pl-5 text-sm">{m.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
