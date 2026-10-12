import { z } from "zod";
import { foodEntryInputSchema } from "./food-entry.ts";
export const foodLogSchema = z.strictObject({
  entry: foodEntryInputSchema,
  consumedLocalTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a valid date and time."),
});
export type FoodLogInput = z.input<typeof foodLogSchema>;
export type FoodMutationState = { error?: string; success?: string; fields?: Record<string, string> };
