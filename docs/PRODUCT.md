# PRODUCT.md — Calorie Tracker

## Purpose
Build a fast, mobile-first calorie logging app. The MVP uses **five hardcoded food definitions**, not an external nutrition API. Users can log food, override calorie estimates, enter calories directly, set daily goals, and view history and logging streaks.

## MVP user journeys
1. Register, sign in, and sign out with Supabase Auth.
2. Set a daily calorie goal (default 2,000 kcal; editable in Settings).
3. On the dashboard, see today's goal, consumed calories, remaining calories, and streak.
4. Tap **Add Food**, search a small built-in catalog in English or Georgian, choose a quantity, review automatically calculated calories, optionally override calories, and save.
5. Use **Quick Add** to enter a calorie amount without selecting a catalog food.
6. Edit or delete a log; totals update immediately.
7. Browse past days and their food entries; edit entries on those dates.

## Hardcoded food catalog
The source of truth for initial food definitions is `src/lib/constants/foods.ts`. These values are **approximate examples**, not guaranteed nutrition facts. The cooking state is part of the name.

| ID | English name | Georgian name | Base serving | Default kcal |
|---|---|---|---|---:|
| chicken-breast | Chicken breast, cooked, skinless | ქათმის ფილე | 100 g | 165 |
| lean-beef | Lean beef, cooked | საქონლის ხორცი | 100 g | 200 |
| white-rice | White rice, cooked | მოხარშული ბრინჯი | 100 g | 130 |
| egg | Egg, large | კვერცხი | 1 piece | 72 |
| khinkali | Khinkali | ხინკალი | 1 piece | 80 |

A food definition contains `id`, `name`, `nameKa`, `baseQuantity`, `unit`, and `caloriesPerBaseQuantity`. Do not add an external nutrition provider or a global foods table for the MVP.

## Calculation and editing rules
- For a food with a 100 g base: `calories = quantity / 100 * caloriesPerBaseQuantity`.
- For a piece-based food: `calories = quantity * caloriesPerBaseQuantity`.
- Example: 250 g cooked chicken breast = 412.5 kcal; display 413 kcal when rounding to whole calories.
- Example: six khinkali at 80 kcal/piece = 480 kcal.
- Users can edit the **calories per base serving** before saving, and the total recalculates.
- Users can explicitly override **total calories**; if they do, that explicit total wins until they choose to recalculate from quantity/rate.
- Persist the effective calorie rate, total calories, quantity, and display name as a snapshot. Later catalog edits must not change old logs.
- Accept decimal gram quantities and positive piece quantities; reject negative or non-finite numbers. Use decimal-safe arithmetic for persisted totals.
- Label catalog values as estimates; preparation and portion sizes vary.
- Quick Add accepts a nonnegative calorie amount and optional description; it does not require a food ID.
- Users may log a custom named food with a quantity, unit, and calorie rate without adding it to a shared catalog.
- Keep the default unit fixed for each built-in food in the MVP; no automatic g/ml conversion.

## Dashboard
- Display selected local date, calorie goal, consumed, remaining (`goal - consumed`), and progress.
- Remaining may be negative; over-goal consumption must remain visible.
- List logs grouped by meal type (`breakfast`, `lunch`, `dinner`, `snack`) or in chronological order.
- Support edit/delete, empty states, loading, and clear save errors.
- Add Food and Quick Add must be easy to reach on small screens.

## Goals and dates
- A new user starts with 2,000 kcal/day until they set a goal.
- Store goal changes with an **effective date**. For a day, use the latest goal whose effective date is on or before that day.
- Each user has a configured IANA timezone (default `UTC`, editable). Interpret calendar days in that timezone, not the server's timezone.
- A goal is a reference target, not a judgment or medical recommendation.

## Streaks
- A logged day is a local calendar day containing at least one saved entry, including Quick Add.
- Current streak counts consecutive logged days ending **today**, or ending **yesterday** when today has no logs yet.
- A missing older day breaks the streak. Deleting the only entry on a day changes the streak.
- Longest streak is the longest consecutive logged-day sequence in available history.
- Streaks measure logging consistency, not whether the calorie goal was met.

## Pages
| Route | Responsibility |
|---|---|
| `/` | Simple landing page |
| `/login`, `/register` | Authentication |
| `/dashboard` | Today's summary and entries |
| `/food` | Catalog search, custom entry, Quick Add |
| `/history` | Calendar and day details |
| `/settings` | Goal, timezone, profile, logout |

## Out of scope for MVP
External nutrition APIs, barcode scanning, AI meal recognition, macronutrients, recipe analysis, meal photo recognition, recommendations, social features, and a food-catalog administration UI.

## Acceptance criteria
- User A cannot read or modify User B's entries, goals, or profile.
- Selecting 250 g chicken calculates 412.5 kcal before display rounding.
- Editing khinkali to 90 kcal/piece at 6 pieces calculates 540 kcal.
- Manual total override is preserved after save/reload.
- Quick Add works without catalog selection.
- History totals do not change when a hardcoded default is edited.
- Daily summaries and streaks use the user's timezone.
- Dashboard works at 320 px width without horizontal overflow.
