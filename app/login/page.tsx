import Link from "next/link";
import AuthCard from "@/components/ui/AuthCard";
import Flash from "@/components/ui/Flash";
import { login } from "@/modules/lms/actions/auth";

// Login page. Shows an email/password form that submits to the `login` server action
// and displays any error passed in the URL (?error=...).
export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <AuthCard title="Log in">
      <Flash error={searchParams.error} />
      <form action={login} className="space-y-4">
        <input name="email" type="email" placeholder="Email" required className="input" />
        <input name="password" type="password" placeholder="Password" required className="input" />
        <button className="btn w-full">Log in</button>
      </form>
      <p className="text-sm text-slate-600">
        No account? <Link href="/register" className="font-medium text-water-700">Register</Link>
      </p>
    </AuthCard>
  );
}
