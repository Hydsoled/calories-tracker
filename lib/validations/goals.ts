import { z } from "zod";
import { calendarDaySchema } from "../dates/local-day.ts";
export const calorieGoalSchema = z.union([z.number(), z.string().regex(/^\d+$/, "Enter a whole number.")])
  .transform(Number).pipe(z.number().int().positive().max(2147483647));
export const goalInputSchema = z.strictObject({ calorieGoal: calorieGoalSchema, effectiveDate: calendarDaySchema });
export type GoalState = { error?: string; success?: string; fields?: Record<string, string> };
