import type { Database } from "@/types/database";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CALORIE_GOAL, effectiveGoal } from "../goals/effective-goal";
import { calorieGoalSchema } from "../validations/goals";
import { calendarDaySchema } from "../dates/local-day";
export async function getEffectiveGoal(supabase: SupabaseClient<Database>, userId: string, day: string) {
  calendarDaySchema.parse(day);
  const result = await supabase.from("daily_goals").select("effective_date,calorie_goal")
    .eq("user_id", userId).lte("effective_date", day).order("effective_date", { ascending: false }).limit(1).maybeSingle();
  if (result.error) return { goal: DEFAULT_CALORIE_GOAL, error: "Could not load your goal. Apply the daily_goals migration and retry." };
  const row = result.data ? z.object({ effective_date: calendarDaySchema, calorie_goal: calorieGoalSchema }).parse(result.data) : null;
  return { goal: effectiveGoal(row ? [{ effectiveDate: row.effective_date, calorieGoal: row.calorie_goal }] : [], day), error: undefined };
}
