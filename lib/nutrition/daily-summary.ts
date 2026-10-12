import { z } from "zod";
import { calorieGoalSchema } from "../validations/goals.ts";
export const dailyTotalSchema = z.union([z.number(), z.string().regex(/^\d+(\.\d{1,3})?$/)])
  .transform(Number).pipe(z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER / 1000));
export function dailySummary(consumedValue: number | string, goalValue: number) {
  const consumed = dailyTotalSchema.parse(consumedValue);
  const goal = calorieGoalSchema.parse(goalValue);
  // Round subtraction to persisted precision without capping over-goal values.
  const remaining = (Math.round(goal * 1000) - Math.round(consumed * 1000)) / 1000;
  return { consumed, goal, remaining, progressPercent: consumed / goal * 100 };
}
