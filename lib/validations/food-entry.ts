import { z } from "zod";
import { BUILT_IN_FOODS } from "../constants/foods.ts";
import { nutritionNumberSchema, positiveNutritionNumberSchema } from "./nutrition.ts";

export const foodUnitSchema = z.enum(["g", "ml", "piece", "serving"]);
export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const measuredFields = {
  quantity: positiveNutritionNumberSchema,
  totalOverride: nutritionNumberSchema.optional(),
  mealType: mealTypeSchema,
};
export const foodEntryInputSchema = z.discriminatedUnion("entryType", [
  z.strictObject({
    entryType: z.literal("catalog"),
    catalogFoodId: z.enum(BUILT_IN_FOODS.map((food) => food.id)),
    caloriesPerBaseQuantity: nutritionNumberSchema.optional(),
    ...measuredFields,
  }),
  z.strictObject({
    entryType: z.literal("custom"),
    foodName: z.string().trim().min(1).max(200),
    unit: foodUnitSchema,
    baseQuantity: positiveNutritionNumberSchema,
    caloriesPerBaseQuantity: nutritionNumberSchema,
    ...measuredFields,
  }),
  z.strictObject({
    entryType: z.literal("quick_add"),
    foodName: z.string().trim().max(200).optional(),
    totalCalories: nutritionNumberSchema,
    mealType: mealTypeSchema,
  }),
]);
export type FoodEntryInput = z.input<typeof foodEntryInputSchema>;
