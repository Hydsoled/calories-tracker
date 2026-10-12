import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

type LoginSearchParams = Promise<{ error?: string }>;

async function ConfirmationError({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const { error } = await searchParams;
  if (error !== "confirmation") return null;

  return (
    <p role="alert" className="mb-4 text-sm text-destructive">
      This link is invalid or expired. Try signing in or request a new recovery
      link.
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        Sign in to your food journal.
      </p>
      <Suspense fallback={null}>
        <ConfirmationError searchParams={searchParams} />
      </Suspense>
      <AuthForm mode="login" configured={!!getSupabaseConfig()} />
      <Link
        href="/register"
        className="mt-5 block py-2 text-center text-sm underline underline-offset-4"
      >
        Create an account
      </Link>
    </>
  );
}
