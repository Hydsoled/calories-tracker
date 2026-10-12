import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";
export default async function Page() {
    return <><h1 className="text-2xl font-semibold">A fresh start</h1><p className="mb-6 mt-2 text-sm text-muted-foreground">Keep a simple record of your meals.</p><AuthForm mode="register" configured={!!getSupabaseConfig()}/><Link href="/login" className="mt-5 block py-2 text-center text-sm underline underline-offset-4">Already have an account? Sign in</Link></>;
}
