# Database Design — Supabase PostgreSQL

This document is a schema contract, not an executable migration. Implement changes as ordered SQL migrations in `supabase/migrations/` and test policies before deployment.

## Tables

### `profiles`
- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text null`
- `timezone text not null default 'UTC'` (validate against IANA timezone names at the application boundary)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Create a profile at registration (trusted database trigger or idempotent server upsert).

### `foods`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `name_ka text null`
- `description text null`
- `reference_quantity numeric(12,3) not null check (reference_quantity > 0)`
- `reference_unit text not null check (reference_unit in ('g','ml','piece','serving'))`
- `calories_per_reference numeric(12,3) not null check (calories_per_reference >= 0)`
- `source text not null default 'custom'`
- `source_id text null`
- `created_by uuid null references auth.users(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`created_by IS NULL` means a curated global food; otherwise the food belongs to a user. External provider results should not become globally trusted entries without review.

### `food_entries`
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `food_id uuid null references foods(id) on delete set null`
- `food_name text not null` (snapshot)
- `quantity numeric(12,3) not null check (quantity > 0)`
- `unit text not null check (unit in ('g','ml','piece','serving'))`
- `reference_quantity numeric(12,3) not null check (reference_quantity > 0)`
- `calories_per_reference numeric(12,3) not null check (calories_per_reference >= 0)`
- `total_calories numeric(12,3) not null check (total_calories >= 0)`
- `is_manual_override boolean not null default false`
- `meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack'))`
- `consumed_at timestamptz not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Automatic total = `quantity / reference_quantity * calories_per_reference`. When `is_manual_override` is true, `total_calories` stores the explicitly entered total. Snapshot fields are immutable with respect to later changes in `foods`.

### `daily_goals`
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `effective_date date not null`
- `calorie_goal integer not null check (calorie_goal > 0)`
- `created_at timestamptz not null default now()`
- `unique (user_id, effective_date)`

For a day D, select the latest goal with `effective_date <= D`; if none exists, use 2000 kcal. A change entered today uses the user's local date, not the server's UTC date.

## Indexes
- `food_entries (user_id, consumed_at desc)`
- `daily_goals (user_id, effective_date desc)` (covered partly by the unique constraint)
- Search indexes for `foods.name` and `foods.name_ka` using `pg_trgm` if enabled; include owner/visibility filters in queries.
- Optional unique `(source, source_id)` for non-null external identifiers, scoped appropriately.

## Row Level Security
Enable RLS on `profiles`, `foods`, `food_entries`, and `daily_goals`.

Policy requirements:
- `profiles`: select/update only where `id = auth.uid()`; profile creation only for own ID.
- `food_entries`: select/insert/update/delete only where `user_id = auth.uid()`; use both `USING` and `WITH CHECK` for writes.
- `daily_goals`: same ownership rules as entries.
- `foods`: select global foods (`created_by IS NULL`) or own foods (`created_by = auth.uid()`); insert/update/delete only owned rows, and never allow regular clients to create/edit global foods.
- For `food_entries.food_id`, ensure the referenced food is global or owned by the same user; validate on the server and enforce with a database constraint/trigger if necessary.
- Avoid overly broad grants to `anon` and `authenticated` roles.

Example policy pattern (adapt to each table):
```sql
create policy "read own entries" on public.food_entries
for select to authenticated
using (user_id = (select auth.uid()));

create policy "insert own entries" on public.food_entries
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "update own entries" on public.food_entries
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "delete own entries" on public.food_entries
for delete to authenticated
using (user_id = (select auth.uid()));
```

## Daily totals and streaks
- Do not store mutable aggregate totals as the source of truth in MVP.
- Derive daily totals from `food_entries.total_calories` for the user's local date range.
- Derive streaks from distinct local calendar dates containing at least one entry.
- Current streak ends today if logged, otherwise yesterday if logged; otherwise zero.
- Recompute after historical changes and timezone updates.

## Migrations and testing
- Use additive migrations when possible; never edit already-applied production migrations.
- Seed global Georgian food examples with documented approximate values and sources; do not imply universal accuracy.
- Test unauthenticated access, cross-user access, custom-food visibility, update ownership, and delete behavior.
- Verify indexes using realistic query plans when data grows.
