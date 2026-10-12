import { Suspense } from "react";
import { getProfile } from "@/lib/data/profile";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { requireUser } from "@/lib/supabase/require-user";
import { localDay } from "@/lib/dates/local-day";
import { getEffectiveGoal } from "@/lib/data/goals";
import { GoalEditor } from "@/components/settings/goal-editor";
import { SignOutButton } from "@/components/auth/sign-out-button";
async function SettingsContent() {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const timezone = profile.timezone;
  const day = localDay(new Date(), timezone);
  const result = await getEffectiveGoal(supabase, user.id, day);
  return <div className="space-y-6"><section className="rounded-2xl border border-border bg-card p-5"><h2 className="mb-4 text-lg font-semibold">Daily goal</h2>{result.error && <p role="alert" className="mb-4 text-destructive">{result.error}</p>}<GoalEditor goal={result.goal} day={day} /></section><section className="space-y-3 rounded-2xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">Account</h2><p className="break-words text-sm">{user.email}</p><ProfileEditor displayName={profile.display_name} timezone={timezone} /><SignOutButton /></section></div>;
}
export default function SettingsPage() {
  return <><h1 className="mb-6 text-2xl font-semibold">Settings</h1><Suspense fallback={<p role="status">Loading settings…</p>}><SettingsContent /></Suspense></>;
}
