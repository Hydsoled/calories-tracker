import { Suspense } from "react";
import { requireUser } from "@/lib/supabase/require-user";

async function ProtectedContent({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-3xl px-4 py-8"><Suspense fallback={<p role="status">Loading your journal…</p>}><ProtectedContent>{children}</ProtectedContent></Suspense></main>;
}
