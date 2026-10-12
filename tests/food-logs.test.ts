import assert from "node:assert/strict";
import { test } from "node:test";
import { consumptionInstant, localDay, localDateTime, timezoneSchema, calendarDaySchema } from "../lib/dates/local-day.ts";
import { editFoodSnapshot } from "../lib/nutrition/edit-food-snapshot.ts";
import { foodEntryRowSchema, snapshotColumns } from "../lib/data/food-entry-model.ts";
import { foodLogSchema } from "../lib/validations/food-log.ts";

const row = foodEntryRowSchema.parse({
  id: "00000000-0000-4000-8000-000000000001", user_id: "00000000-0000-4000-8000-000000000002",
  entry_type: "catalog", catalog_food_id: "khinkali", food_name: "Saved recipe name",
  quantity: "6.000", unit: "piece", base_quantity: "2.000", calories_per_base_quantity: "180.000",
  total_calories: "540.000", is_total_override: false, meal_type: "lunch",
  consumed_at: "2026-10-12T10:00:00Z", local_date: "2026-10-12", created_at: "2026-10-12T10:00:00Z", updated_at: "2026-10-12T10:00:00Z",
});
test("local dates follow the profile timezone across UTC midnight", () => {
  assert.equal(localDay("2026-10-12T21:00:00Z", "Asia/Tbilisi"), "2026-10-13");
  assert.equal(localDay("2026-10-12T01:00:00Z", "America/Los_Angeles"), "2026-10-11");
  assert.equal(localDateTime("2026-10-12T20:00:00Z", "Asia/Tbilisi"), "2026-10-13T00:00");
});
test("wall-clock input resolves in the profile timezone including fractional offsets", () => {
  assert.equal(consumptionInstant("2026-10-12T15:30", "Asia/Tbilisi"), "2026-10-12T11:30:00.000Z");
  assert.equal(consumptionInstant("2026-10-12T15:30", "Asia/Kathmandu"), "2026-10-12T09:45:00.000Z");
  assert.equal(consumptionInstant("2026-01-01T00:15", "Pacific/Kiritimati"), "2025-12-31T10:15:00.000Z");
});
test("DST gaps are rejected and repeated times choose the earlier occurrence", () => {
  assert.throws(() => consumptionInstant("2026-03-08T02:30", "America/New_York"), /does not exist/);
  assert.equal(consumptionInstant("2026-11-01T01:30", "America/New_York"), "2026-11-01T05:30:00.000Z");
  assert.throws(() => consumptionInstant("2011-12-30T12:00", "Pacific/Apia"), /does not exist/);
});
test("invalid dates, offset zones and impossible calendar dates are rejected", () => {
  for (const value of ["2026-02-30T10:00", "2026-13-01T10:00", "2026-10-12T24:00", "2026-10-12", "1899-01-01T12:00"]) assert.throws(() => consumptionInstant(value, "UTC"));
  for (const zone of ["Invalid/Zone", "+04:00", ""]) assert.equal(timezoneSchema.safeParse(zone).success, false);
  assert.throws(() => localDay("invalid", "UTC"));
});
test("catalog edits use saved name, unit, base quantity and rate rather than defaults", () => {
  const edit = editFoodSnapshot(row, { entryType: "catalog", catalogFoodId: "khinkali", quantity: 8, mealType: "dinner" });
  assert.equal(edit.foodName, "Saved recipe name");
  assert.equal(edit.baseQuantity, 2);
  assert.equal(edit.caloriesPerBaseQuantity, 180);
  assert.equal(edit.totalCalories, 720);
  assert.equal(row.total_calories, 540);
  assert.equal(row.local_date, "2026-10-12");
});
test("edit preserves a supplied manual override and reset recomputes from saved values", () => {
  const input = { entryType: "catalog", catalogFoodId: "khinkali", quantity: 8, mealType: "dinner" } as const;
  assert.equal(editFoodSnapshot(row, { ...input, totalOverride: 0 }).totalCalories, 0);
  assert.equal(editFoodSnapshot(row, input).isTotalOverride, false);
  assert.throws(() => editFoodSnapshot(row, { ...input, catalogFoodId: "egg" }));
  assert.throws(() => editFoodSnapshot(row, { entryType: "quick_add", totalCalories: 20, mealType: "snack" }));
});
test("mutation envelope rejects submitted ownership and local dates", () => {
  const input = { entry: { entryType: "quick_add", totalCalories: 10, mealType: "snack" }, consumedLocalTime: "2026-10-12T12:00" };
  assert.equal(foodLogSchema.safeParse(input).success, true);
  assert.equal(foodLogSchema.safeParse({ ...input, user_id: row.user_id }).success, false);
  assert.equal(foodLogSchema.safeParse({ ...input, local_date: "2020-01-01" }).success, false);
});
test("snapshot serialization stores the explicit override and no owner or date", () => {
  const snapshot = editFoodSnapshot(row, { entryType: "catalog", catalogFoodId: "khinkali", quantity: 6, totalOverride: 123.456, mealType: "lunch" });
  const columns = snapshotColumns(snapshot);
  assert.equal(columns.total_calories, 123.456);
  assert.equal(columns.is_total_override, true);
  assert.equal(columns.food_name, "Saved recipe name");
  assert.equal("user_id" in columns, false);
  assert.equal("local_date" in columns, false);
});


test("selected log dates reject impossible days and accept leap days", () => {
  assert.equal(calendarDaySchema.safeParse("2024-02-29").success, true);
  for (const day of ["2026-02-29", "2026-02-30", "2026-13-01", "1899-12-31", "not-a-date"]) assert.equal(calendarDaySchema.safeParse(day).success, false);
});
