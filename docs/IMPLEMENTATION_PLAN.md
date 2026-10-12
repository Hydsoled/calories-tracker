# Implementation plan

## Baseline audit
Read AGENTS.md and all four original docs. The repository contains only the Next.js 16 / React 19 starter, strict TypeScript, Tailwind 4, ESLint, Geist fonts, and npm lockfile. No product features, Supabase configuration, migrations, UI primitives, or tests existed. Preserve the existing root `app/` organization; use root `lib/`, `actions/`, and `components/` equivalents of the suggested `src/` structure.

Specific product docs refine the general instructions: five code-defined foods, no foods table or nutrition API, in-memory bilingual search without network debounce, default UTC and 2,000 kcal, stable saved local dates, historical goal records, decimal-safe snapshots.

Each phase stops at its verification gate. Do not proceed on local checks alone when live integration checks remain required.

## Phase 1 — Foundation and authentication
1. Add semantic design tokens, accessible UI primitives, product metadata, landing page, environment example, and check scripts.
2. Add Supabase SSR browser/server clients and Next.js 16 Proxy for session refresh. Verify users on protected pages and writes.
3. Add validated registration, email confirmation, login, logout, password recovery, loading/error/success states, and protected dashboard shell.
4. Add profiles migration: secure signup trigger, UTC default, timestamps, owner-only RLS, and backfill existing users. Do not introduce food or goal data yet.
5. Verify typecheck, lint, unit tests, production build, public page rendering, unauthenticated redirect, and missing-config behavior.
6. Live gate: configure a Supabase project, apply migration, register/confirm/login/logout/recover a password, refresh a session, and test profile isolation with two accounts. Without credentials/database tooling, explicitly mark these checks pending.

## Phase 2 — Catalog and calculation rules
1. Add the five exact English/Georgian definitions from PRODUCT.md under `lib/constants/foods.ts`.
2. Add typed units/entry models, bilingual in-memory search, decimal-safe calculations, Zod quantity/rate/override validation.
3. Test 250 g chicken = 412.5 kcal, 6 khinkali = 480 kcal, edited rate = 540 kcal; overrides, decimal precision, invalid/non-finite inputs, and display rounding.
4. Gate: unit tests, typecheck, lint; no data mutations yet.

## Phase 3 — Food entries and fast logging
1. Add food_entries migration with every documented enum, numeric, catalog/custom/Quick Add shape constraint, snapshots, timestamps, owner RLS, and `(user_id, local_date, consumed_at DESC)` index.
2. Add timezone utility and server-derived dates; derive user ownership from verified auth. Add create/edit/delete actions with shared validated calculations.
3. Implement Food search, responsive accessible log sheet, custom entry, Quick Add, quantity/rate edits and explicit override reset. Revalidate affected reads.
4. Gate: calculator/date tests, two-user RLS tests, database shape rejection, snapshot persistence, create/edit/delete integration, accessible mobile form behavior.

## Phase 4 — Dashboard and goal history
1. Add daily_goals migration with positive integer goals, unique user/effective date, owner RLS and indexed lookup.
2. Add effective goal lookup with 2,000 fallback and date-scoped upsert. Build settings goal editor.
3. Add selected local-day totals, uncapped remaining/progress, meal groups, Add Food/Quick Add actions, loading/empty/error states and mobile/desktop navigation.
4. Gate: historical goals unchanged, effective-date fallback, totals after edits/deletes, over-goal presentation, user isolation.

## Phase 5 — History, profile timezone and streaks
1. Add profile/timezone settings with IANA validation. Historical saved local dates stay stable; explicit entry edits recompute dates.
2. Add paginated month reads and accessible calendar/day details.
3. Add pure calendar-day streak utilities: today or yesterday anchor, longest streak, deletion effects, DST/month/year boundaries.
4. Gate: timezone and streak unit tests, historical-date policy integration, keyboard calendar navigation.

## Phase 6 — Production verification and deployment
1. Validate 320/375/768/desktop layouts, focus, touch targets, safe areas, reduced motion, loading/error/success states and estimated nutrition disclosure.
2. Run sign up → goal → khinkali → rate override → dashboard → edit/delete → history end-to-end with two-user RLS checks.
3. Run all checks, review auth redirects, caching, indexes, pagination and environment configuration. Generate database TypeScript types from applied schema before expanding database access.
4. Deploy to Vercel with public URL/key and trusted site origin configured; configure production Auth redirects and email delivery. Smoke-test deployment.

## Phase 1 verification status
Local typecheck, lint and four auth validation/redirect tests pass. Build and runtime smoke verification remain blocked by environment permissions. Live Supabase verification remains pending without a configured project. See README.md for exact outcomes and setup. The user subsequently reported applying the profiles migration and resolving signup configuration, and authorized Phase 2. Remaining Phase 1 integration checks have not been independently verified.


## Phase 2 verification status
Complete: five catalog definitions under the existing root `lib/constants/foods.ts`, bilingual local search, typed snapshot models, strict Zod input schemas and pure snapshot construction for catalog/custom/Quick Add. Calculations use BigInt thousandths, round half up once to three decimal places, reject excess precision and numeric(12,3) overflow, and keep whole-calorie display rounding separate. An explicit total override (including zero) wins until omitted; Quick Add marks its explicit total as an override.

Typecheck and lint passed. All 15 tests passed (5 auth, 10 nutrition), including documented examples, precision, overflow, invalid entry shapes, bilingual search and snapshot behavior. No new dependencies, migrations, writes or UI screens were added. Phase 3 has not started.

## Phase 3 implementation and verification status
Implemented food_entries migration with documented shape/range checks, owner RLS and day index; authenticated create/edit/delete actions; server-derived timezone dates; snapshot-preserving catalog edits; Food screen with local search, logging dialog, manual overrides/reset, custom entries, Quick Add, date selection, pagination and delete confirmation. Dashboard links to Food. No goal or streak functionality has been started.

Typecheck, lint and 24 unit tests pass. Production build was attempted and retried with approved access; both hit Turbopack worker port `EPERM` in this environment. Live migration execution, SQL isolation/constraint tests, authenticated CRUD and browser accessibility/responsive checks remain pending. `supabase/tests/food_entries.sql` is a rollback-only, two-user test script ready for the SQL editor. Phase 4 has not started; finish this live gate first.
