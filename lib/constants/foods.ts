import type { BuiltInFood } from "../../types/food.ts";

// Approximate examples. Never use catalog defaults to recalculate saved entries.
export const BUILT_IN_FOODS = [
  { id: "chicken-breast", name: "Chicken breast, cooked, skinless", nameKa: "ქათმის ფილე", baseQuantity: 100, unit: "g", caloriesPerBaseQuantity: 165 },
  { id: "lean-beef", name: "Lean beef, cooked", nameKa: "საქონლის ხორცი", baseQuantity: 100, unit: "g", caloriesPerBaseQuantity: 200 },
  { id: "white-rice", name: "White rice, cooked", nameKa: "მოხარშული ბრინჯი", baseQuantity: 100, unit: "g", caloriesPerBaseQuantity: 130 },
  { id: "egg", name: "Egg, large", nameKa: "კვერცხი", baseQuantity: 1, unit: "piece", caloriesPerBaseQuantity: 72 },
  { id: "khinkali", name: "Khinkali", nameKa: "ხინკალი", baseQuantity: 1, unit: "piece", caloriesPerBaseQuantity: 80 },
] as const satisfies readonly BuiltInFood[];

export type CatalogFoodId = (typeof BUILT_IN_FOODS)[number]["id"];
export function findBuiltInFood(id: string): BuiltInFood | undefined {
  return BUILT_IN_FOODS.find((food) => food.id === id);
}
