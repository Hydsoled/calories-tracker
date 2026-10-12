"use client";
import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthMode, AuthState } from "@/lib/validations/auth";
const labels: Record<AuthMode, string> = { login: "Sign in", register: "Create account", "forgot-password": "Send recovery link", "reset-password": "Update password" };
export function AuthForm({ mode, configured }: {
    mode: AuthMode;
    configured: boolean;
}) {
    const [state, action, pending] = useActionState(authenticate.bind(null, mode), {} as AuthState);
    const hasEmail = mode !== "reset-password";
    const hasPassword = mode !== "forgot-password";
    return <form action={action} className="space-y-5">
    {!configured && <p role="status" className="rounded-xl bg-muted p-3 text-sm">Authentication setup is pending. Configure the Supabase environment variables to enable sign in.</p>}
    {hasEmail && <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">Email</label><Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required aria-invalid={!!state.fields?.email} aria-describedby={state.fields?.email ? "email-error" : undefined}/><p id="email-error" className="text-sm text-destructive">{state.fields?.email}</p></div>}
    {hasPassword && <div className="space-y-2"><label htmlFor="password" className="text-sm font-medium">{mode === "reset-password" ? "New password" : "Password"}</label><Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 8} maxLength={128} required aria-invalid={!!state.fields?.password} aria-describedby={mode === "login" ? "password-error" : "password-help password-error"}/>{mode !== "login" && <p id="password-help" className="text-sm text-muted-foreground">Use at least 8 characters.</p>}<p id="password-error" className="text-sm text-destructive">{state.fields?.password}</p></div>}
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl bg-muted p-3 text-sm">{state.success}</p>}
    <Button className="w-full" disabled={pending || !configured}>{pending ? "Please wait…" : labels[mode]}</Button>
    {mode === "login" && <Link href="/forgot-password" className="block py-2 text-center text-sm underline underline-offset-4">Forgot password?</Link>}
    {mode === "reset-password" && state.success && <Button asChild variant="outline" className="w-full"><Link href="/dashboard">Return to dashboard</Link></Button>}
  </form>;
}
