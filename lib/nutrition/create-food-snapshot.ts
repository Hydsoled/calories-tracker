import { findBuiltInFood } from "../constants/foods.ts";
import { foodEntryInputSchema, type FoodEntryInput } from "../validations/food-entry.ts";
import { calculateCalories } from "./calculate-calories.ts";
import type { FoodEntrySnapshot } from "../../types/food.ts";

export function createFoodSnapshot(input: FoodEntryInput): FoodEntrySnapshot {
  const entry = foodEntryInputSchema.parse(input);
  if (entry.entryType === "quick_add") {
    return {
      entryType: "quick_add", catalogFoodId: null,
      foodName: entry.foodName || "Quick Add", totalCalories: entry.totalCalories,
      isTotalOverride: true, mealType: entry.mealType,
      quantity: null, unit: null, baseQuantity: null, caloriesPerBaseQuantity: null,
    };
  }
  const source = entry.entryType === "custom"
    ? { name: entry.foodName, unit: entry.unit, baseQuantity: entry.baseQuantity, caloriesPerBaseQuantity: entry.caloriesPerBaseQuantity }
    : findBuiltInFood(entry.catalogFoodId);
  if (!source) throw new Error("The selected catalog food is unavailable.");
  const baseQuantity = source.baseQuantity;
  const rate = entry.caloriesPerBaseQuantity ?? source.caloriesPerBaseQuantity;
  const measured = {
    quantity: entry.quantity, baseQuantity, caloriesPerBaseQuantity: rate,
    totalCalories: calculateCalories({ quantity: entry.quantity, baseQuantity, caloriesPerBaseQuantity: rate, totalOverride: entry.totalOverride }),
    isTotalOverride: entry.totalOverride !== undefined,
    mealType: entry.mealType,
  };
  if (entry.entryType === "custom") {
    return { ...measured, entryType: "custom", catalogFoodId: null, foodName: entry.foodName, unit: entry.unit };
  }
  return { ...measured, entryType: "catalog", catalogFoodId: entry.catalogFoodId, foodName: source.name, unit: source.unit };
}
