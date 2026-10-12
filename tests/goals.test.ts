import assert from "node:assert/strict";
import { test } from "node:test";
import { effectiveGoal } from "../lib/goals/effective-goal.ts";
import { goalInputSchema } from "../lib/validations/goals.ts";
import { dailySummary } from "../lib/nutrition/daily-summary.ts";

test("goals fall back to 2000 before the first effective date", () => {
  assert.equal(effectiveGoal([], "2026-10-12"), 2000);
  assert.equal(effectiveGoal([{ effectiveDate: "2026-10-13", calorieGoal: 1800 }], "2026-10-12"), 2000);
});
test("effective goal uses the latest applicable record regardless of input order", () => {
  const goals = [
    { effectiveDate: "2026-10-15", calorieGoal: 2200 },
    { effectiveDate: "2026-10-01", calorieGoal: 1800 },
    { effectiveDate: "2026-10-12", calorieGoal: 1900 },
  ];
  assert.equal(effectiveGoal(goals, "2026-10-01"), 1800);
  assert.equal(effectiveGoal(goals, "2026-10-11"), 1800);
  assert.equal(effectiveGoal(goals, "2026-10-12"), 1900);
  assert.equal(effectiveGoal(goals, "2026-10-16"), 2200);
});
test("updating one date's goal preserves earlier effective values", () => {
  const before = [{ effectiveDate: "2026-10-01", calorieGoal: 1800 }, { effectiveDate: "2026-10-12", calorieGoal: 1900 }];
  const after = before.map((record) => record.effectiveDate === "2026-10-12" ? { ...record, calorieGoal: 2100 } : record);
  assert.equal(effectiveGoal(after, "2026-10-11"), effectiveGoal(before, "2026-10-11"));
  assert.equal(effectiveGoal(after, "2026-10-12"), 2100);
});
test("goal validation rejects decimals, blanks, overflow and invalid calendar dates", () => {
  assert.equal(goalInputSchema.parse({ calorieGoal: "1800", effectiveDate: "2026-10-12" }).calorieGoal, 1800);
  for (const calorieGoal of [0, -1, 1.5, NaN, Infinity, "", " ", "1.5", "1e3", 2147483648]) {
    assert.equal(goalInputSchema.safeParse({ calorieGoal, effectiveDate: "2026-10-12" }).success, false);
  }
  assert.equal(goalInputSchema.safeParse({ calorieGoal: 1800, effectiveDate: "2026-02-30" }).success, false);
  assert.equal(goalInputSchema.safeParse({ calorieGoal: 1800, effectiveDate: "2026-10-12", user_id: "spoofed" }).success, false);
});
test("daily summary handles empty days and preserves decimal consumption", () => {
  assert.deepEqual(dailySummary(0, 2000), { consumed: 0, goal: 2000, remaining: 2000, progressPercent: 0 });
  const summary = dailySummary("412.5", 2000);
  assert.equal(summary.consumed, 412.5);
  assert.equal(summary.remaining, 1587.5);
  assert.equal(dailySummary(0.1, 1).remaining, 0.9);
});
test("over-goal values remain uncapped", () => {
  assert.deepEqual(dailySummary(2120, 2000), { consumed: 2120, goal: 2000, remaining: -120, progressPercent: 106 });
  assert.throws(() => dailySummary(-1, 2000));
  assert.throws(() => dailySummary(Infinity, 2000));
  assert.throws(() => dailySummary(100, 0));
});
