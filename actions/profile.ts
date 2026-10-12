"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { profileInputSchema, type ProfileState } from "@/lib/validations/profile";
export async function saveProfile(_previous: ProfileState, form: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireUser();
  const input = profileInputSchema.safeParse({ displayName: form.get("displayName"), timezone: form.get("timezone") });
  if (!input.success) {
    const fields: Record<string, string> = {};
    for (const issue of input.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { error: "Check your profile details.", fields };
  }
  const { error } = await supabase.from("profiles").update({ display_name: input.data.displayName || null, timezone: input.data.timezone }).eq("id", user.id).select("id").single();
  if (error) return { error: "Could not save your profile. Please try again." };
  for (const route of ["/settings", "/food", "/dashboard", "/history"]) revalidatePath(route);
  return { success: "Profile saved. Existing food-log dates have been preserved." };
}
