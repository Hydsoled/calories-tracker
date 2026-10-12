import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";
export default async function Page() {
    return <><h1 className="text-2xl font-semibold">Reset your password</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">We’ll email you a link to choose a new password.</p><AuthForm mode="forgot-password" configured={!!getSupabaseConfig()}/><Link href="/login" className="mt-5 block py-2 text-center text-sm underline underline-offset-4">Back to sign in</Link></>;
}
