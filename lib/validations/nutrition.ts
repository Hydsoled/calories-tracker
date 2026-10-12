import { z } from "zod";

// PostgreSQL numeric(12,3): nine integer digits and three fractional digits.
// Reject excess precision instead of silently changing the submitted quantity/rate.
export const nutritionNumberSchema = z.union([z.number().finite(), z.string()])
  .refine((value) => /^\d{1,9}(\.\d{1,3})?$/.test(String(value)), {
    message: "Use a nonnegative number with at most 9 integer digits and 3 decimal places.",
  })
  .transform(Number);
export const positiveNutritionNumberSchema = nutritionNumberSchema.refine(
  (value) => value > 0, "Enter a quantity greater than zero.",
);
export const calorieCalculationSchema = z.strictObject({
  quantity: positiveNutritionNumberSchema,
  baseQuantity: positiveNutritionNumberSchema,
  caloriesPerBaseQuantity: nutritionNumberSchema,
  totalOverride: nutritionNumberSchema.optional(),
});
