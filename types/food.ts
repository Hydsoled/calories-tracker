export type FoodUnit = "g" | "ml" | "piece" | "serving";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type BuiltInFood = Readonly<{
  id: string;
  name: string;
  nameKa: string;
  baseQuantity: number;
  unit: "g" | "piece";
  caloriesPerBaseQuantity: number;
}>;

// Nutritional snapshot only. Ownership and dates are assigned by the server in Phase 3.
type SnapshotBase = {
  foodName: string;
  totalCalories: number;
  isTotalOverride: boolean;
  mealType: MealType;
};
type MeasuredSnapshot = SnapshotBase & {
  quantity: number;
  unit: FoodUnit;
  baseQuantity: number;
  caloriesPerBaseQuantity: number;
};
export type FoodEntrySnapshot =
  | (MeasuredSnapshot & { entryType: "catalog"; catalogFoodId: string })
  | (MeasuredSnapshot & { entryType: "custom"; catalogFoodId: null })
  | (SnapshotBase & {
      entryType: "quick_add";
      catalogFoodId: null;
      quantity: null;
      unit: null;
      baseQuantity: null;
      caloriesPerBaseQuantity: null;
    });
