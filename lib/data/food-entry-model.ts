import { z } from "zod";
import { foodUnitSchema, mealTypeSchema } from "../validations/food-entry.ts";
import { nutritionNumberSchema } from "../validations/nutrition.ts";
import type { FoodEntrySnapshot } from "../../types/food.ts";

export const foodEntryRowSchema = z.object({
  id: z.uuid(), user_id: z.uuid(), entry_type: z.enum(["catalog", "custom", "quick_add"]),
  catalog_food_id: z.string().nullable(), food_name: z.string(),
  quantity: nutritionNumberSchema.nullable(), unit: foodUnitSchema.nullable(),
  base_quantity: nutritionNumberSchema.nullable(), calories_per_base_quantity: nutritionNumberSchema.nullable(),
  total_calories: nutritionNumberSchema, is_total_override: z.boolean(), meal_type: mealTypeSchema,
  consumed_at: z.string(), local_date: z.string(), created_at: z.string(), updated_at: z.string(),
});
export type FoodEntryRow = z.infer<typeof foodEntryRowSchema>;
export function snapshotColumns(snapshot: FoodEntrySnapshot) {
  return {
    entry_type: snapshot.entryType, catalog_food_id: snapshot.catalogFoodId, food_name: snapshot.foodName,
    quantity: snapshot.quantity, unit: snapshot.unit, base_quantity: snapshot.baseQuantity,
    calories_per_base_quantity: snapshot.caloriesPerBaseQuantity, total_calories: snapshot.totalCalories,
    is_total_override: snapshot.isTotalOverride, meal_type: snapshot.mealType,
  };
}
