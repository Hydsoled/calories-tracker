"use server";
import type { FoodEntrySnapshot } from "@/types/food";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { foodLogSchema, type FoodMutationState } from "@/lib/validations/food-log";
import { createFoodSnapshot } from "@/lib/nutrition/create-food-snapshot";
import { editFoodSnapshot } from "@/lib/nutrition/edit-food-snapshot";
import { foodEntryRowSchema, snapshotColumns } from "@/lib/data/food-entry-model";
import { consumptionInstant, localDay, timezoneSchema } from "@/lib/dates/local-day";

function refreshFoodRoutes() {
  for (const route of ["/food", "/dashboard", "/history"]) revalidatePath(route);
}
export async function saveFoodEntry(id: string | null, _previous: FoodMutationState, form: FormData): Promise<FoodMutationState> {
  const { supabase, user } = await requireUser();
  let input: unknown;
  try { input = JSON.parse(String(form.get("payload"))); }
  catch { return { error: "Invalid food entry. Please check the form." }; }
  const parsed = foodLogSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
    return { error: "Check the highlighted fields.", fields };
  }
  if (id !== null && !z.uuid().safeParse(id).success) return { error: "Invalid entry ID." };
  try {
    const profile = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
    if (profile.error) return { error: "Could not load your profile. Please try again." };
    const timezone = z.object({ timezone: timezoneSchema }).parse(profile.data).timezone;
    let snapshot: FoodEntrySnapshot;
    if (id) {
      const original = await supabase.from("food_entries").select("*").eq("id", id).eq("user_id", user.id).single();
      if (original.error) return { error: "This entry is unavailable or no longer belongs to your account." };
      snapshot = editFoodSnapshot(foodEntryRowSchema.parse(original.data), parsed.data.entry);
    } else snapshot = createFoodSnapshot(parsed.data.entry);
    let consumedAt: string;
    try { consumedAt = consumptionInstant(parsed.data.consumedLocalTime, timezone); }
    catch (error) { return { error: error instanceof Error ? error.message : "Choose a valid date and time." }; }
    const columns = { ...snapshotColumns(snapshot), consumed_at: consumedAt, local_date: localDay(consumedAt, timezone) };
    const result = id
      ? await supabase.from("food_entries").update(columns).eq("id", id).eq("user_id", user.id).select("id").single()
      : await supabase.from("food_entries").insert({ ...columns, user_id: user.id }).select("id").single();
    if (result.error) return { error: "Could not save this entry. Check the database setup or try again." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: "Check the quantity, rate and total. Use at most three decimal places." };
    if (error instanceof RangeError) return { error: "The calorie total is too large. Reduce the quantity or rate." };
    return { error: "Could not save. Check the selected local time and entry details, then try again." };
  }
  refreshFoodRoutes();
  return { success: id ? "Food entry updated." : "Food entry saved." };
}
export async function deleteFoodEntry(id: string, _previous: FoodMutationState): Promise<FoodMutationState> {
  void _previous;
  const { supabase, user } = await requireUser();
  if (!z.uuid().safeParse(id).success) return { error: "Invalid entry ID." };
  const result = await supabase.from("food_entries").delete().eq("id", id).eq("user_id", user.id).select("id").single();
  if (result.error) return { error: "Could not delete this entry. It may already have been removed." };
  refreshFoodRoutes();
  return { success: "Food entry deleted." };
}
