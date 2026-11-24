import Link from "next/link";
import AuthCard from "@/components/ui/AuthCard";
import Flash from "@/components/ui/Flash";
import { register } from "@/modules/lms/actions/auth";

// Registration page for new students. Submits to the `register` server action
// and displays any error passed in the URL (?error=...).
export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <AuthCard title="Create a student account">
      <Flash error={searchParams.error} />
      <form action={register} className="space-y-4">
        <input name="full_name" placeholder="Full name" required className="input" />
        <input name="email" type="email" placeholder="Email" required className="input" />
        <input name="password" type="password" placeholder="Password (min 6 characters)" minLength={6} required className="input" />
        <button className="btn w-full">Register</button>
      </form>
      <p className="text-sm text-slate-600">
        Already registered? <Link href="/login" className="font-medium text-water-700">Log in</Link>
      </p>
      <p className="text-xs text-slate-500">Instructor accounts are approved by an administrator.</p>
    </AuthCard>
  );
}
