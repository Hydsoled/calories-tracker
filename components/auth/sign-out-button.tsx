"use client";
import { useActionState } from "react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { AuthState } from "@/lib/validations/auth";
export function SignOutButton() {
    const [state, action, pending] = useActionState(async () => signOut(), {} as AuthState);
    return <form action={action}><Button variant="outline" disabled={pending}>{pending ? "Signing out…" : "Sign out"}</Button>{state.error && <p role="alert">{state.error}</p>}</form>;
}
