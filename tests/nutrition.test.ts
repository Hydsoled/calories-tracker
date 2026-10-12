import assert from "node:assert/strict";
import { test } from "node:test";
import { BUILT_IN_FOODS } from "../lib/constants/foods.ts";
import { searchCatalog } from "../lib/nutrition/catalog-search.ts";
import { calculateCalories, roundCaloriesForDisplay } from "../lib/nutrition/calculate-calories.ts";
import { createFoodSnapshot } from "../lib/nutrition/create-food-snapshot.ts";
import { foodEntryInputSchema } from "../lib/validations/food-entry.ts";

test("catalog contains exactly the documented five food estimates", () => {
  assert.deepEqual(BUILT_IN_FOODS.map(({ id, baseQuantity, unit, caloriesPerBaseQuantity }) => [id, baseQuantity, unit, caloriesPerBaseQuantity]), [
    ["chicken-breast", 100, "g", 165], ["lean-beef", 100, "g", 200],
    ["white-rice", 100, "g", 130], ["egg", 1, "piece", 72], ["khinkali", 1, "piece", 80],
  ]);
});
test("search matches English and Georgian names and handles blank/no-match queries", () => {
  assert.equal(searchCatalog("  CHICKEN ")[0]?.id, "chicken-breast");
  assert.equal(searchCatalog("ხინკალი")[0]?.id, "khinkali");
  assert.equal(searchCatalog("ბრინჯი")[0]?.id, "white-rice");
  assert.equal(searchCatalog("  ").length, 5);
  assert.equal(searchCatalog("no such food").length, 0);
});
test("per-100-g, pieces and edited rates match acceptance examples", () => {
  assert.equal(calculateCalories({ quantity: 250, baseQuantity: 100, caloriesPerBaseQuantity: 165 }), 412.5);
  assert.equal(roundCaloriesForDisplay(412.5), 413);
  assert.equal(calculateCalories({ quantity: 6, baseQuantity: 1, caloriesPerBaseQuantity: 80 }), 480);
  assert.equal(calculateCalories({ quantity: 6, baseQuantity: 1, caloriesPerBaseQuantity: 90 }), 540);
});
test("decimal arithmetic rounds half up once and supports fractional pieces", () => {
  assert.equal(calculateCalories({ quantity: "0.1", baseQuantity: "0.3", caloriesPerBaseQuantity: "0.3" }), 0.1);
  assert.equal(calculateCalories({ quantity: 1, baseQuantity: 2, caloriesPerBaseQuantity: 0.001 }), 0.001);
  assert.equal(calculateCalories({ quantity: 1, baseQuantity: 3, caloriesPerBaseQuantity: 1 }), 0.333);
  assert.equal(calculateCalories({ quantity: 1.5, baseQuantity: 1, caloriesPerBaseQuantity: 72 }), 108);
  assert.equal(calculateCalories({ quantity: 1, baseQuantity: 1, caloriesPerBaseQuantity: 0 }), 0);
});
test("explicit totals win including zero, and removing override restores calculated total", () => {
  const input = { quantity: 6, baseQuantity: 1, caloriesPerBaseQuantity: 90 };
  assert.equal(calculateCalories({ ...input, totalOverride: 123.456 }), 123.456);
  assert.equal(calculateCalories({ ...input, quantity: 7, totalOverride: 0 }), 0);
  assert.equal(calculateCalories(input), 540);
});
test("invalid quantities, rates, overrides and overflow are rejected", () => {
  const input = { quantity: 1, baseQuantity: 1, caloriesPerBaseQuantity: 80 };
  for (const quantity of [0, -1, NaN, Infinity, 0.0001, 1000000000, "", " ", "1e3", "0x10", "1.2345"]) {
    assert.throws(() => calculateCalories({ ...input, quantity }));
  }
  for (const baseQuantity of [0, -1, Infinity]) assert.throws(() => calculateCalories({ ...input, baseQuantity }));
  for (const value of [-1, NaN, Infinity, 0.0001]) {
    assert.throws(() => calculateCalories({ ...input, caloriesPerBaseQuantity: value }));
    assert.throws(() => calculateCalories({ ...input, totalOverride: value }));
  }
  assert.equal(calculateCalories({ ...input, totalOverride: "999999999.999" }), 999999999.999);
  assert.throws(() => calculateCalories({ ...input, quantity: 999999999.999, baseQuantity: 0.001 }), RangeError);
});
test("catalog snapshots preserve effective rate, total and original display name", () => {
  const snapshot = createFoodSnapshot({ entryType: "catalog", catalogFoodId: "khinkali", quantity: 6, caloriesPerBaseQuantity: 90, mealType: "lunch" });
  assert.equal(snapshot.foodName, "Khinkali");
  assert.equal(snapshot.totalCalories, 540);
  assert.equal(snapshot.caloriesPerBaseQuantity, 90);
  assert.equal(snapshot.isTotalOverride, false);
  const copy = structuredClone(snapshot);
  const laterSnapshot = createFoodSnapshot({ entryType: "catalog", catalogFoodId: "khinkali", quantity: 6, caloriesPerBaseQuantity: 100, totalOverride: 555, mealType: "lunch" });
  assert.equal(laterSnapshot.totalCalories, 555);
  assert.equal(laterSnapshot.isTotalOverride, true);
  assert.deepEqual(snapshot, copy);
});
test("custom snapshots support each documented unit", () => {
  for (const unit of ["g", "ml", "piece", "serving"] as const) {
    const snapshot = createFoodSnapshot({ entryType: "custom", foodName: "  My meal  ", unit, quantity: 2, baseQuantity: 1, caloriesPerBaseQuantity: 12.5, mealType: "dinner" });
    assert.equal(snapshot.catalogFoodId, null);
    assert.equal(snapshot.foodName, "My meal");
    assert.equal(snapshot.unit, unit);
    assert.equal(snapshot.totalCalories, 25);
  }
});
test("Quick Add needs only explicit calories and a meal, with a default description", () => {
  const snapshot = createFoodSnapshot({ entryType: "quick_add", totalCalories: 0, foodName: " ", mealType: "snack" });
  assert.equal(snapshot.foodName, "Quick Add");
  assert.equal(snapshot.totalCalories, 0);
  assert.equal(snapshot.isTotalOverride, true);
  for (const key of ["catalogFoodId", "quantity", "unit", "baseQuantity", "caloriesPerBaseQuantity"] as const) assert.equal(snapshot[key], null);
});
test("entry schemas reject spoofed ownership, unknown IDs, units and mixed entry shapes", () => {
  const catalog = { entryType: "catalog", catalogFoodId: "egg", quantity: 1, mealType: "breakfast" };
  for (const data of [
    { ...catalog, user_id: "spoofed" }, { ...catalog, catalogFoodId: "unknown" },
    { ...catalog, unit: "ml" }, { ...catalog, mealType: "invalid" },
    { entryType: "quick_add", mealType: "snack" },
    { entryType: "quick_add", totalCalories: 10, quantity: 1, mealType: "snack" },
    { entryType: "custom", foodName: " ", unit: "g", quantity: 1, baseQuantity: 100, caloriesPerBaseQuantity: 20, mealType: "snack" },
  ]) assert.equal(foodEntryInputSchema.safeParse(data).success, false);
});
