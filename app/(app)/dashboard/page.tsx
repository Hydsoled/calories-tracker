import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/supabase/require-user";
import { SignOutButton } from "@/components/auth/sign-out-button";

async function DashboardContent() {
  const { user } = await requireUser();
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Your food journal</h1>
        <SignOutButton />
      </header>
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="break-words text-sm text-muted-foreground">
          Signed in as {user.email}
        </p>
        <h2 className="mt-4 text-lg font-semibold">Welcome to Calorie Tracker</h2>
        <p className="mt-2 text-muted-foreground">
          Your account is ready. Log a meal or use Quick Add. Daily summaries will
          be added in the next phase.
        </p>
        <Button asChild className="mt-4">
          <Link href="/food">Add Food</Link>
        </Button>
      </section>
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<p role="status">Loading your dashboard…</p>}>
      <DashboardContent />
    </Suspense>
  );
}
