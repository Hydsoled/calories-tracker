import { cache } from "react";
import { requireUser } from "../supabase/require-user";
import { profileRowSchema } from "../validations/profile";
export const getProfile = cache(async function getProfile() {
  const { supabase, user } = await requireUser();
  const result = await supabase.from("profiles").select("display_name,timezone").eq("id", user.id).single();
  if (result.error) throw new Error("Could not load your profile.");
  return profileRowSchema.parse(result.data);
});
