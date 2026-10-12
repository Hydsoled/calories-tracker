import { AppNavigation } from "@/components/layout/app-navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/supabase/require-user";

async function ProtectedContent({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 lg:pl-44 xl:pl-4"><Suspense fallback={<p role="status">Loading your journal…</p>}><ProtectedContent><AppNavigation />{children}</ProtectedContent></Suspense></main>;
}
