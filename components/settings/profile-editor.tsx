"use client";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveProfile } from "@/actions/profile";
import type { ProfileState } from "@/lib/validations/profile";
export function ProfileEditor({ displayName, timezone }: { displayName: string | null; timezone: string }) {
  const [state, action, pending] = useActionState(saveProfile, {} as ProfileState);
  return <form action={action} className="space-y-4"><div><label htmlFor="displayName" className="block text-sm font-medium">Display name (optional)</label><Input id="displayName" name="displayName" maxLength={80} autoComplete="nickname" defaultValue={displayName ?? ""} aria-invalid={!!state.fields?.displayName} aria-describedby="displayName-error" /><p id="displayName-error" className="text-sm text-destructive">{state.fields?.displayName}</p></div><div><label htmlFor="timezone" className="block text-sm font-medium">Timezone</label><Input id="timezone" name="timezone" required defaultValue={timezone} list="timezone-options" aria-invalid={!!state.fields?.timezone} aria-describedby="timezone-error timezone-help" /><datalist id="timezone-options">{["UTC", "Asia/Tbilisi", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Australia/Sydney"].map((zone) => <option key={zone} value={zone} />)}</datalist><p id="timezone-error" className="text-sm text-destructive">{state.fields?.timezone}</p><p id="timezone-help" className="mt-2 text-sm text-muted-foreground">Enter an IANA timezone, such as Asia/Tbilisi. New entries use this timezone. Existing saved dates stay unchanged; editing an entry recalculates its date in the new timezone.</p></div>{state.error && <p role="alert" className="text-destructive">{state.error}</p>}{state.success && <p role="status">{state.success}</p>}<Button disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button></form>;
}
