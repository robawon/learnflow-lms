import Flash from "@/components/ui/Flash";
import PageHeader from "@/components/ui/PageHeader";
import GlowButton from "@/components/ui/GlowButton";
import StatusBadge from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDay } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { setUserRole, setUserStatus } from "@/modules/lms/actions/admin";

// Admin user management: modern user table with initials avatars, role chips, and inline controls
export default async function AdminUsers({
  searchParams,
}: {
  searchParams: { msg?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as Profile[];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="User Accounts & Permissions"
        subtitle="Review platform accounts, approve instructor privileges, and manage system access."
      />

      <Flash msg={searchParams.msg} error={searchParams.error} />

      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-surface-2/40 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Registered Users ({users.length})
          </p>
        </div>

        <div className="divide-y divide-border">
          {users.map((u) => {
            const initials =
              u.full_name
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "U";

            const isCurrent = u.id === user!.id;

            return (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition hover:bg-surface-2/50"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-semibold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-main truncate flex items-center gap-2">
                      <span>{u.full_name}</span>
                      {isCurrent && (
                        <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[10px] font-bold text-primary">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {u.email} &middot; Joined {formatDay(u.created_at)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Role:
                      </span>
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-main border border-border">
                        {u.role}
                      </span>
                      <StatusBadge status={u.status} size="sm" />
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-0">
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="input h-9 text-xs w-32 py-1"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <GlowButton variant="ghost" size="sm">
                        Save Role
                      </GlowButton>
                    </form>

                    <form action={setUserStatus}>
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={u.status === "suspended" ? "active" : "suspended"}
                      />
                      <button
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          u.status === "suspended"
                            ? "bg-success-subtle text-success border border-success/30 hover:bg-success hover:text-white"
                            : "bg-danger-subtle text-danger border border-danger/30 hover:bg-danger hover:text-white"
                        }`}
                      >
                        {u.status === "suspended" ? "Reactivate" : "Suspend"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
