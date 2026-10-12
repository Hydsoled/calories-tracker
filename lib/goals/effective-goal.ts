import { calendarDaySchema } from "../dates/local-day.ts";
import { calorieGoalSchema } from "../validations/goals.ts";
export const DEFAULT_CALORIE_GOAL = 2000;
export type GoalRecord = { effectiveDate: string; calorieGoal: number };
export function effectiveGoal(records: readonly GoalRecord[], selectedDate: string): number {
  calendarDaySchema.parse(selectedDate);
  let latest: GoalRecord | undefined;
  for (const record of records) {
    calendarDaySchema.parse(record.effectiveDate);
    calorieGoalSchema.parse(record.calorieGoal);
    if (record.effectiveDate <= selectedDate && (!latest || record.effectiveDate > latest.effectiveDate)) latest = record;
  }
  return latest?.calorieGoal ?? DEFAULT_CALORIE_GOAL;
}
