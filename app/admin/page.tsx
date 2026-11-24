import Flash from "@/components/ui/Flash";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { setUserRole, setUserStatus } from "@/modules/lms/actions/admin";

// Administrator user management: lists every account with its role and status.
// The admin can change a user's role (for example approve an instructor) and suspend or activate accounts.
export default async function AdminUsers({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const users = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Approve instructors, manage roles and suspend accounts." />
      <Flash msg={searchParams.msg} error={searchParams.error} />

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{u.full_name} {u.id === user!.id && <span className="text-xs text-slate-400">(you)</span>}</p>
              <p className="truncate text-sm text-slate-500">{u.email} &middot; joined {formatDay(u.created_at)}</p>
              <div className="mt-1"><StatusBadge status={u.status} /></div>
            </div>
            {u.id !== user!.id && (
              <div className="flex flex-wrap items-center gap-2">
                <form action={setUserRole} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} className="input w-36">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="btn-ghost">Save role</button>
                </form>
                <form action={setUserStatus}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="status" value={u.status === "suspended" ? "active" : "suspended"} />
                  <button className="btn-danger">{u.status === "suspended" ? "Activate" : "Suspend"}</button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
