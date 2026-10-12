import { Suspense } from "react";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { timezoneSchema, localDay } from "@/lib/dates/local-day";
import { getEffectiveGoal } from "@/lib/data/goals";
import { GoalEditor } from "@/components/settings/goal-editor";
import { SignOutButton } from "@/components/auth/sign-out-button";
async function SettingsContent() {
  const { supabase, user } = await requireUser();
  const profile = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  if (profile.error) throw new Error("Could not load your profile.");
  const timezone = z.object({ timezone: timezoneSchema }).parse(profile.data).timezone;
  const day = localDay(new Date(), timezone);
  const result = await getEffectiveGoal(supabase, user.id, day);
  return <div className="space-y-6"><section className="rounded-2xl border border-border bg-card p-5"><h2 className="mb-4 text-lg font-semibold">Daily goal</h2>{result.error && <p role="alert" className="mb-4 text-destructive">{result.error}</p>}<GoalEditor goal={result.goal} day={day} /></section><section className="space-y-3 rounded-2xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Account</h2><p className="break-words text-sm">{user.email}</p><p className="text-sm text-muted-foreground">Timezone: {timezone}. Profile and timezone editing arrive in the next phase.</p><SignOutButton /></section></div>;
}
export default function SettingsPage() {
  return <><h1 className="mb-6 text-2xl font-semibold">Settings</h1><Suspense fallback={<p role="status">Loading settings…</p>}><SettingsContent /></Suspense></>;
}
