"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { goalInputSchema, type GoalState } from "@/lib/validations/goals";
export async function saveGoal(_previous: GoalState, form: FormData): Promise<GoalState> {
  const { supabase, user } = await requireUser();
  const parsed = goalInputSchema.safeParse({ calorieGoal: form.get("calorieGoal"), effectiveDate: form.get("effectiveDate") });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { error: "Check the goal and effective date.", fields };
  }
  const { error } = await supabase.from("daily_goals").upsert({ user_id: user.id, effective_date: parsed.data.effectiveDate, calorie_goal: parsed.data.calorieGoal }, { onConflict: "user_id,effective_date" });
  if (error) return { error: "Could not save your goal. Check the daily_goals migration or try again." };
  for (const route of ["/settings", "/dashboard", "/history"]) revalidatePath(route);
  return { success: "Calorie goal saved for the selected effective date." };
}
