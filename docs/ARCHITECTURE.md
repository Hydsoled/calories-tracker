# ARCHITECTURE.md — Calorie Tracker

## Technical decisions
- Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui, Lucide.
- Supabase Auth + PostgreSQL; `@supabase/ssr` for authenticated server-side access.
- Zod for server validation; React Hook Form for interactive forms where useful.
- Server Components for initial reads; Client Components for food search, quantity controls, dialogs, and progress interactions.
- Server Actions or route handlers for writes. Revalidate affected routes after mutations.
- **No external nutrition provider**. Five built-in foods live in a TypeScript constant.
- Deploy to Vercel with environment variables configured separately.

## Suggested structure
```text
src/
  app/
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (app)/dashboard/page.tsx
    (app)/food/page.tsx
    (app)/history/page.tsx
    (app)/settings/page.tsx
    auth/callback/route.ts
    layout.tsx
    page.tsx
  actions/
    food-entries.ts
    goals.ts
    profile.ts
  components/
    ui/
    dashboard/
    food/
    history/
    layout/
  lib/
    constants/foods.ts
    nutrition/calculate-calories.ts
    nutrition/catalog-search.ts
    dates/local-day.ts
    streaks/calculate-streaks.ts
    supabase/client.ts
    supabase/server.ts
    validations/
  types/
supabase/migrations/
docs/
AGENTS.md
```
Follow the actual codebase if it already has an equivalent organization; avoid restructuring for its own sake.

## Data ownership
- Built-in food catalog is code-only, globally visible, and read-only.
- Supabase stores only user profiles, goal history, and consumed food entries.
- Each food entry is a **snapshot** and does not require a foreign key to a food catalog.
- `catalog_food_id` is optional text, used only to identify which built-in food was chosen; custom and Quick Add entries have `NULL`.
- Never trust a client-supplied `user_id`. Derive ownership from the authenticated server-side Supabase user.
- Enable and test RLS on every user-owned table.

## Catalog model
```ts
type BuiltInFood = {
  id: string;
  name: string;
  nameKa: string;
  baseQuantity: number; // 100 for g foods, 1 for piece foods
  unit: "g" | "piece";
  caloriesPerBaseQuantity: number;
};
```
Search `name` and `nameKa` case-insensitively in memory. With five foods, there is no need for an API, database search, caching layer, or debounce requirement.

## Food-entry model
Each entry has `entry_type` (`catalog`, `custom`, `quick_add`), optional `catalog_food_id`, snapshot `food_name`, `quantity`, `unit`, `base_quantity`, `calories_per_base_quantity`, `total_calories`, `meal_type`, `consumed_at`, and `local_date`.

- Catalog: snapshot values from the selected built-in food, with optional rate or total override.
- Custom: user enters name, quantity, unit, and calories per base quantity.
- Quick Add: name defaults to `Quick Add`, no catalog ID, no quantity/rate required, explicit total required.
- `local_date` is determined on the server using the user's configured timezone and the selected consumption timestamp/date. It is stored for efficient day-based queries.
- On timezone changes, historical `local_date` values need a defined policy. **MVP policy:** dates are assigned when an entry is saved and remain stable unless that entry is explicitly edited; do not silently rewrite history.

## Calculation pipeline
1. Client loads built-in catalog.
2. User selects food, quantity, and optionally edits the rate or total.
3. Shared pure calculator derives preview total.
4. Client submits validated fields.
5. Server authenticates user, validates all fields and enum values, recomputes non-overridden totals, and inserts a snapshot.
6. Server returns success; UI refreshes dashboard/history.

Shared utilities in root `lib/nutrition/` use BigInt integer thousandths for calculation. Inputs accept numbers or plain decimal strings with at most three fractional digits, matching `numeric(12,3)` (maximum 999,999,999.999). Reject blank strings, negative/non-finite values, excess precision and out-of-range calculated totals. Round calculated totals half up once to 0.001 kcal; whole-calorie display rounding never changes the snapshot. Explicit total overrides, including zero, win until omitted. No automatic unit conversion is performed.

`createFoodSnapshot` validates catalog/custom/Quick Add shapes and constructs independent nutritional snapshots. Catalog names, units and base quantities come from the catalog; rate and total may be overridden. Quick Add has null measurement fields and `isTotalOverride: true`. Server ownership and consumption dates are assigned separately in Phase 3. Store `numeric` values in PostgreSQL; do not rely on binary floating-point equality.

## Authentication
- Use Supabase Auth and `@supabase/ssr`.
- Protect authenticated pages and all writes.
- Server code verifies user identity with `supabase.auth.getUser()` or an equivalent verified flow.
- Never place service-role credentials in client code.
- Only expose Supabase URL and public publishable/anon key.
- Include login/logout, registration, session refresh, and password recovery as needed.

## Read patterns
- Dashboard: fetch entries for one `local_date` and the effective goal for that date.
- History: fetch entries for the visible date range; aggregate by `local_date`.
- Streaks: fetch distinct logged dates in the needed history range; calculate with pure utilities.
- Index `(user_id, local_date)` and goal `(user_id, effective_date)`.

## Mobile-first UI
- 320 px minimum viewport.
- Bottom navigation on mobile, desktop navigation at larger widths.
- Prominent Add Food and Quick Add actions.
- Accessible dialogs, form labels, focus states, and loading indicators.
- Use shadcn/ui components and existing design tokens from `docs/DESIGN.md`.

## Verification
- Unit tests: per-100-g math, per-piece math, overrides, invalid inputs, timezone boundaries, streak rules.
- Integration tests: authenticated writes, RLS isolation, edit/delete, goal history.
- End-to-end: sign up → set goal → log khinkali → override rate → view dashboard → edit/delete → inspect history.
- Run typecheck, lint, and tests before claiming a feature is done.

## Implementation order
1. Supabase project, migrations, auth, protected routes.
2. Hardcoded catalog and pure calculation utilities.
3. Add/edit/delete entries and Quick Add.
4. Dashboard totals and goals.
5. History, timezone handling, and streaks.
6. Responsive polish, tests, deployment.

## Phase 3 implementation
- `/food` has bilingual catalog search, custom food, Quick Add, a native modal dialog styled as a bottom sheet on mobile, and paginated entries for a selected saved local date (20 per page).
- `actions/food-entries.ts` authenticates before every write, validates the strict mutation envelope, reads the verified profile timezone, recomputes nutritional snapshots and filters update/delete by both entry ID and owner. RLS is the independent database ownership boundary.
- New catalog entries copy current defaults; edits reuse the owned entry's saved name, unit and base quantity. Editing an entry cannot change its type or catalog ID. Custom entries may edit their own name, unit and reference quantity.
- UI submits `consumedLocalTime` as a wall-clock string. `lib/dates/local-day.ts` resolves it in the profile's IANA timezone, rejects nonexistent daylight-saving times and chooses the earlier occurrence when a local time repeats. UTC instants and server-derived local-date snapshots are saved. Changing timezone alone never rewrites saved dates.
- Saves and deletes revalidate Food, Dashboard and History. Dashboard summaries, goal controls, history calendar and streaks remain later phases.
- Native `dialog.showModal()` provides modal focus containment and Escape handling; close restores focus to the launching control. Submission keeps the form open on errors and closes it after success. Delete requests require confirmation.

## Phase 4 dashboard and goals
- Dashboard and Settings perform request-time reads inside page-local Suspense boundaries; the Supabase server client calls `connection()` before clock-dependent session checks. `requireUser` uses React's request-scoped `cache` to share verified auth reads within a render, without persistent caching of identities.
- Goals are authenticated, date-scoped upserts. `getEffectiveGoal` loads the latest owner row on/before the selected date, defaulting to 2,000 only when none exists. Query failures show an error rather than a misleading successful summary.
- Dashboard calls the owner-filtered SECURITY INVOKER `daily_food_total` function, independently of its 20-row visible log page. Remaining values and percentage text remain uncapped; the visual bar stops at its track width and communicates over-goal values in text and accessible value text.
- Shared FoodEntryCard provides edit/delete behavior on both Dashboard and Food; mutation revalidation refreshes summaries. Settings exposes effective-date goal editing and sign out. Mobile bottom navigation and desktop sidebar share destinations; History remains disabled until Phase 5.
