# Product Requirements — Calorie Tracker

## Purpose
A mobile-first calorie tracker where users can log food in seconds, monitor daily energy intake, and build consistent logging habits. The initial release supports English and Georgian food names and Georgian dishes.

## MVP user journeys
1. Register or sign in with email and password.
2. Set a daily calorie goal (default 2,000 kcal; editable).
3. Search for a food by English or Georgian name, or create a custom food.
4. Choose quantity and unit (g, ml, piece, serving), review the calorie estimate, optionally override it, and save.
5. See today's consumed, remaining, and goal calories immediately.
6. Edit/delete food logs, including logs for previous dates.
7. View daily history and a consecutive-day logging streak.
8. Adjust timezone and profile preferences.

## Routes
- `/`: public landing page.
- `/login`, `/register`, `/forgot-password`: authentication.
- `/dashboard`: daily summary, today's entries, quick-add action, streak.
- `/food`: food search and custom food creation; add/edit entries via sheet or dialog.
- `/history`: month calendar and selected-day entries.
- `/settings`: daily goal, timezone, display name, logout.

## Daily dashboard
- Display goal, consumed, remaining (`goal - consumed`), and percentage (`consumed / goal * 100`).
- A negative remaining value is valid; do not hide over-goal consumption.
- Group entries by meal type: breakfast, lunch, dinner, snack.
- Include an inviting empty state and prominent Add Food action.
- Default to the user's current local date, determined from their configured IANA timezone.

## Food search and catalog
- Search both `name` and `name_ka`, including partial matches.
- Include starter entries for khinkali/ხინკალი, khachapuri/ხაჭაპური, mtsvadi/მწვადი, lobiani/ლობიანი, yogurt, bread, and common staples.
- Local catalog is the primary source. An external nutrition API is optional and must be normalized, rate-limited, and cached before display.
- Clearly label calorie values as estimates and include a source when available. Do not present invented estimates as verified values.
- Foods may be global or user-owned. Users can create private foods.

## Logging behavior
- Units: grams, milliliters, pieces, servings. Never convert ml to g without a known density.
- Gram-based formula: `(grams / 100) * kcal_per_100g`.
- Piece/serving formula: `quantity * kcal_per_unit`.
- The UI must allow changing quantity, per-unit calories, and total calories.
- A manual total override takes precedence until the user explicitly returns to automatic calculation; clearly indicate override mode.
- Example: six khinkali with an editable estimated kcal/piece value. No single fixed calorie count should be treated as authoritative.
- Store the food name, quantity, unit, calorie rate, total, and optional override as snapshots on each entry so later catalog changes do not rewrite history.
- Support editing and deleting any owned entry and selecting a consumption date/time.
- Do not allow negative calories or nonpositive quantities; apply sensible upper bounds to reject accidental entries.
- Use decimal-safe calculations and round only for presentation or at a documented storage boundary.

## Goals
- New users start with 2,000 kcal/day until they set a different target.
- Goal changes take effect from the selected effective date (default today in the user's timezone), preserving earlier targets.
- At most one goal change per user/effective date; updating that day's value replaces it.
- For any day, use the most recent goal with `effective_date <= day`, otherwise the default.
- Calorie tracking is informational; do not shame users for exceeding a goal.

## Streaks
- A logged day is a calendar day with at least one valid food entry, based on the user's configured timezone.
- Current streak: consecutive logged days ending today, or ending yesterday if today has no log yet.
- Longest streak: longest historical sequence of logged calendar days.
- Editing or deleting entries can retroactively change streaks.
- Logging streaks are independent of meeting the calorie goal.
- Timezone changes can change historical day grouping; recompute accordingly.

## History
- Month navigation with days containing logs and their daily totals.
- Select a day to inspect, edit, or delete its entries and see the effective goal.
- Query by bounded date ranges; never download an entire history for the calendar.

## Out of scope for MVP
AI photo recognition, barcode scanning, macro tracking, push notifications, subscriptions, social features, medical advice, and offline sync.

## Acceptance criteria
- An authenticated user can add six khinkali, change calories per piece, and see correct totals without a refresh.
- A user can log 360 g of yogurt at 84 kcal/100 g and see 302.4 kcal before display rounding.
- Editing a food's catalog calories does not modify an existing log.
- One user's private foods, logs, and goals are invisible to another user.
- Historical edits correctly update daily totals and streaks.
- The core flows work at 320 px mobile width and on desktop.
