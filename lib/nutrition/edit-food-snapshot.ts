import type { FoodEntryRow } from "../data/food-entry-model.ts";
import { createFoodSnapshot } from "./create-food-snapshot.ts";
import { calculateCalories } from "./calculate-calories.ts";
import { foodEntryInputSchema, type FoodEntryInput } from "../validations/food-entry.ts";
import type { FoodEntrySnapshot } from "../../types/food.ts";

export function editFoodSnapshot(original: FoodEntryRow, input: FoodEntryInput): FoodEntrySnapshot {
  const entry = foodEntryInputSchema.parse(input);
  if (entry.entryType !== original.entry_type) throw new Error("An entry's type cannot be changed. Create a new entry instead.");
  if (entry.entryType !== "catalog") return createFoodSnapshot(entry);
  if (entry.catalogFoodId !== original.catalog_food_id || !original.unit || !original.base_quantity || original.calories_per_base_quantity === null) {
    throw new Error("The saved catalog entry is invalid or does not match the selected food.");
  }
  const rate = entry.caloriesPerBaseQuantity ?? original.calories_per_base_quantity;
  return {
    entryType: "catalog", catalogFoodId: entry.catalogFoodId, foodName: original.food_name,
    unit: original.unit, baseQuantity: original.base_quantity, quantity: entry.quantity,
    caloriesPerBaseQuantity: rate, mealType: entry.mealType, isTotalOverride: entry.totalOverride !== undefined,
    totalCalories: calculateCalories({ quantity: entry.quantity, baseQuantity: original.base_quantity, caloriesPerBaseQuantity: rate, totalOverride: entry.totalOverride }),
  };
}
