# DATABASE.md — Calorie Tracker

## Overview
Supabase PostgreSQL stores **user data only**. The initial five predefined foods are hardcoded in `src/lib/constants/foods.ts`; there is **no `foods` table** and no nutrition-provider integration in the MVP.

Use SQL migrations in `supabase/migrations/`. All user-owned tables require RLS.

## Tables

### `profiles`
| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK, FK to `auth.users(id)` ON DELETE CASCADE |
| `display_name` | `text` | nullable |
| `timezone` | `text` | NOT NULL, default `'UTC'` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

Create a profile at signup using a safe database trigger or authenticated onboarding. Validate timezone against IANA identifiers in application code.

### `daily_goals`
| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK to `auth.users(id)` ON DELETE CASCADE |
| `effective_date` | `date` | NOT NULL |
| `calorie_goal` | `integer` | NOT NULL, CHECK `calorie_goal > 0` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

Add UNIQUE `(user_id, effective_date)`. Resolve a day's goal with the latest row whose `effective_date <= selected_date`; if none exists, use the product default of 2,000 kcal. An update on a given date upserts that date's goal, without rewriting earlier dates.

### `food_entries`
| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK to `auth.users(id)` ON DELETE CASCADE |
| `entry_type` | `text` | NOT NULL; `catalog`, `custom`, or `quick_add` |
| `catalog_food_id` | `text` | nullable; matches hardcoded ID only |
| `food_name` | `text` | NOT NULL |
| `quantity` | `numeric(12,3)` | nullable; positive if present |
| `unit` | `text` | nullable; `g`, `piece`, `serving`, or `ml` |
| `base_quantity` | `numeric(12,3)` | nullable; positive if present |
| `calories_per_base_quantity` | `numeric(12,3)` | nullable; nonnegative if present |
| `total_calories` | `numeric(12,3)` | NOT NULL; nonnegative |
| `is_total_override` | `boolean` | NOT NULL, default false |
| `meal_type` | `text` | NOT NULL; breakfast/lunch/dinner/snack |
| `consumed_at` | `timestamptz` | NOT NULL |
| `local_date` | `date` | NOT NULL; saved using user's timezone |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |

Constraints:
- `entry_type IN ('catalog', 'custom', 'quick_add')`.
- `meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')`.
- `unit IS NULL OR unit IN ('g', 'piece', 'serving', 'ml')`.
- `quantity IS NULL OR quantity > 0`.
- `base_quantity IS NULL OR base_quantity > 0`.
- `calories_per_base_quantity IS NULL OR calories_per_base_quantity >= 0`.
- `total_calories >= 0`.
- For `catalog` and `custom` entries, require quantity, unit, base quantity, and rate.
- For `catalog`, require `catalog_food_id`; for `custom` and `quick_add`, require it to be null.
- For `quick_add`, quantity/unit/base quantity/rate must be null and the total is supplied explicitly.
- For calculated entries, `is_total_override = false`; manual total edits set it to true.

Do not add a foreign key on `catalog_food_id`: its IDs are code-defined, not database records. The food name and nutritional values are snapshots, so past logs remain stable if catalog defaults change.

## RLS policy model
Enable RLS on `profiles`, `daily_goals`, and `food_entries`.

For each table, create explicit SELECT, INSERT, UPDATE, DELETE policies as appropriate:
- SELECT: `user_id = (select auth.uid())` (for profiles: `id = (select auth.uid())`).
- INSERT: `WITH CHECK (user_id = (select auth.uid()))` (profiles: `id = (select auth.uid())`).
- UPDATE: both `USING` and `WITH CHECK` enforce the same owner.
- DELETE: `USING` enforces the same owner.

For profile creation through a trigger, use a narrowly scoped, secure `SECURITY DEFINER` function with a fixed `search_path`, and review its privileges. Do not expose a service-role key to the browser.

## Indexes
- `food_entries (user_id, local_date, consumed_at DESC)` for dashboard/history.
- `daily_goals (user_id, effective_date DESC)` (the unique constraint also supports lookup).
- `food_entries (user_id, consumed_at)` only if a real query requires it.

## Data access patterns
**Today's logs:** `WHERE user_id = authenticated_user AND local_date = requested_local_date`.

**Daily total:** `SUM(total_calories)` for that day; default to zero when there are no entries.

**Goal:** latest `daily_goals` row with `effective_date <= requested_local_date`; otherwise 2,000 kcal.

**Streak:** retrieve distinct `local_date` values with entries, ordered descending. Count consecutive dates ending today, or yesterday when today has no logs; longest streak uses all available logged dates.

## Date/time policy
- `consumed_at` is a UTC-normalized instant (`timestamptz`).
- `local_date` is the calendar date in the user's selected IANA timezone at save time.
- The server derives `local_date` from the verified profile timezone and selected timestamp/date, never blindly trusts a submitted date.
- If a user changes timezone, existing `local_date` snapshots remain unchanged in the MVP. Editing an entry may recompute its `local_date` based on the new timezone.
- Use calendar-day arithmetic, not 24-hour timestamp subtraction, for streaks.

## Migration and testing rules
- All schema changes require versioned SQL migrations.
- Test policies with two different authenticated users.
- Test catalog, custom, and Quick Add entry constraints.
- Test manual overrides and historical snapshot persistence.
- Test date boundaries and streak changes after deleting a day's only entry.
- Never perform schema mutations from browser code.
