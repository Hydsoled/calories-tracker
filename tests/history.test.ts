import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateStreaks } from "../lib/streaks/calculate-streaks.ts";
import { monthDays, shiftMonth, shiftDay } from "../lib/dates/calendar.ts";
import { profileInputSchema } from "../lib/validations/profile.ts";
import { localDay } from "../lib/dates/local-day.ts";

test("empty history and future dates do not create a streak", () => {
  assert.deepEqual(calculateStreaks([], "2026-10-12"), { current: 0, longest: 0 });
  assert.deepEqual(calculateStreaks(["2026-10-13"], "2026-10-12"), { current: 0, longest: 0 });
});
test("current streak ends today or yesterday while today is unfinished", () => {
  const dates = ["2026-10-10", "2026-10-11"];
  assert.equal(calculateStreaks(dates, "2026-10-12").current, 2);
  assert.equal(calculateStreaks([...dates, "2026-10-12"], "2026-10-12").current, 3);
  assert.equal(calculateStreaks(dates, "2026-10-13").current, 0);
});
test("duplicate entries do not inflate streaks; longest includes older runs", () => {
  const dates = ["2026-10-11", "2026-10-11", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-12"];
  assert.deepEqual(calculateStreaks(dates, "2026-10-12"), { current: 2, longest: 3 });
});
test("deleting a day's last entry breaks a run", () => {
  const dates = ["2026-10-10", "2026-10-11", "2026-10-12"];
  assert.deepEqual(calculateStreaks(dates.filter((day) => day !== "2026-10-11"), "2026-10-12"), { current: 1, longest: 1 });
  assert.deepEqual(calculateStreaks(dates.filter((day) => day !== "2026-10-12"), "2026-10-12"), { current: 2, longest: 2 });
});
test("calendar day streaks cross year, leap-day and DST boundaries", () => {
  assert.equal(calculateStreaks(["2025-12-31", "2026-01-01"], "2026-01-01").current, 2);
  assert.equal(calculateStreaks(["2024-02-28", "2024-02-29", "2024-03-01"], "2024-03-01").current, 3);
  assert.equal(calculateStreaks(["2026-03-07", "2026-03-08", "2026-03-09"], "2026-03-09").current, 3);
  assert.throws(() => calculateStreaks(["2026-02-30"], "2026-03-01"));
});
test("month calendar produces correct month lengths and year navigation", () => {
  assert.equal(monthDays("2024-02").length, 29);
  assert.equal(monthDays("2026-02").length, 28);
  assert.equal(monthDays("2026-04").length, 30);
  assert.equal(monthDays("2026-12").at(-1), "2026-12-31");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftDay("2024-03-01", -1), "2024-02-29");
});
test("profile input validates IANA zones, name limits and rejects owner fields", () => {
  assert.deepEqual(profileInputSchema.parse({ displayName: "  Reader  ", timezone: "Asia/Tbilisi" }), { displayName: "Reader", timezone: "Asia/Tbilisi" });
  for (const input of [{ displayName: "a".repeat(81), timezone: "UTC" }, { displayName: "", timezone: "Invalid/Zone" }, { displayName: "", timezone: "+04:00" }, { displayName: "", timezone: "UTC", id: "spoofed" }]) assert.equal(profileInputSchema.safeParse(input).success, false);
});
test("timezone changes alter new local dates without mutating saved date snapshots", () => {
  const instant = "2026-10-12T21:00:00Z";
  const saved = { consumedAt: instant, localDate: localDay(instant, "UTC") };
  assert.equal(localDay(saved.consumedAt, "Asia/Tbilisi"), "2026-10-13");
  assert.equal(saved.localDate, "2026-10-12");
});
