# Calorie Tracker

Mobile-first Next.js App Router application. Product, architecture, database and design requirements are in `docs/`. See `docs/IMPLEMENTATION_PLAN.md` for the baseline audit and gated six-phase plan.

## Current phase

Foundation and Supabase Auth: landing page, semantic theme, shadcn-style Button/Input primitives, registration, login, confirmation, password recovery/update, sign out, session-refresh Proxy and protected dashboard shell. The existing root `app/` structure is retained. Green and destructive tokens use darker shades than the suggested palette for readable text contrast. Phase 2 also provides the five-food catalog, bilingual search, validated snapshot inputs and decimal-safe calorie calculations. Phase 3 adds food logging screens and persistence; Phase 4 adds goals and dashboard totals; Phase 5 adds history, streaks and profile/timezone editing; final production verification remains Phase 6.

## Setup

1. Install dependencies with `npm ci` (Node 24 supports the built-in TypeScript test runner).
2. Copy `.env.example` to `.env.local`. Set the Supabase project URL, public publishable key and trusted app origin (`NEXT_PUBLIC_SITE_URL`). Never use a service-role key.
3. Apply `supabase/migrations/202610120001_profiles.sql` to your Supabase project through your migration workflow or SQL editor. It creates owner-only profiles, a secure signup trigger, UTC defaults, timestamp updates, and backfills existing users.
4. In Supabase Auth, enable email/password authentication, set the Site URL and allow `http://localhost:3000/auth/callback` plus the production callback URL. Keep email confirmation enabled. Configure production email delivery before deployment.
5. Default signup and recovery templates should use Supabase's `ConfirmationURL` for the PKCE callback flow. Open email links in the same browser that requested them; cross-browser/email-scanner flows need a separate token-hash implementation in a future phase.
6. Start `npm run dev`. Without Supabase variables, public pages still render, auth forms show setup status and protected routes redirect to login.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

The build may require network access to download Geist fonts. No live Supabase credentials or database CLI were present during implementation. Migration execution, signup/email confirmation, recovery, refresh and two-user RLS checks require the configured project; do not consider Phase 1 fully verified until the following checklist passes.

## Required live Phase 1 gate

- Register two users; verify each gets a UTC profile and confirm each email.
- Login, reload the dashboard, test expired-session refresh, and sign out. Direct dashboard access while signed out redirects to login.
- Request recovery, follow its link in the same browser, update password and sign in with the new password; expired/reused links show recoverable errors.
- Through authenticated Supabase clients for A and B, verify A cannot select, insert, update or delete B's profile (including changing an owned profile ID to B).
- Verify the signup function cannot be directly called by anon/authenticated roles, and that profile edits update `updated_at`.
- Check forms at 320/375/768/desktop widths, keyboard focus, pending/error announcements, and successful sign out.

Stop here until these checks pass. Later migrations will introduce daily_goals and food_entries with the documented constraints and owner RLS; there will be no foods table.

## Local verification outcome (2026-10-12)

Typecheck and lint passed; all four validation/redirect tests passed. The production build was attempted twice: the sandbox blocked font downloads, then the approved retry failed when Turbopack attempted to bind a worker port (`EPERM`). The dev server started with approved access, but HTTP smoke checks could not run: sandbox localhost requests failed and approval for the retry was declined. Page rendering, redirects, responsive behavior, production build and all live Supabase checks remain pending. Dependency installation reported five high-severity advisories; review an online audit before production deployment rather than applying breaking updates automatically.


## Phase 2 verification

Typecheck, lint and all 15 tests pass (5 auth and 10 nutrition tests). Utilities live in `lib/constants/`, `lib/nutrition/`, `lib/validations/` and `types/food.ts`. Decimal values support three places and numeric(12,3) range; calculated results round half up once to 0.001 kcal. Whole-calorie rounding applies only to display. No Supabase migration is required for this phase.

## Phase 3 — food logging

Apply `supabase/migrations/202610120002_food_entries.sql` once in Supabase SQL Editor after the profiles migration. Sign in and open `/food` (or use Add Food on the dashboard). Select a catalog food, Custom food or Quick Add. Save quantity/rate, an optional manual total, meal and consumption date/time. The date/time uses your profile timezone (UTC until settings are implemented). Select View date to inspect earlier saved logs; Edit and Delete operate on those entries. Logging the past or future does not change today's list automatically.

Local verification: typecheck, lint and all 24 unit tests pass. Production build remains blocked by the environment's Turbopack worker-port permission error even after an approved retry. Browser and live Supabase tests have not been run; Phase 3 is implemented but its integration gate is pending.

Required live gate before Phase 4:

1. Apply the new migration; run the full `supabase/tests/food_entries.sql` in SQL Editor. It creates temporary test users, tests both owner identities, rejects invalid entry shapes and ownership changes, checks snapshot/override persistence and owned delete, and rolls back all changes.
2. Sign in: log 250 g chicken (412.5 kcal), 6 khinkali at 90 kcal/piece (540 kcal), a manual total, a custom ml/serving food and Quick Add with zero calories. Reload to verify persisted values.
3. Edit quantity/rate, preserve a manual total, select Use calculated total, and delete with confirmation. Select a past date, save/edit an entry there and verify the saved local date.
4. Check timezone boundaries/DST behavior with a verified profile timezone; invalid clock-change times should show an actionable error. Changing timezone must not rewrite existing saved dates.
5. Check 320/375/768/desktop widths, dialog focus containment, Escape/close focus restoration, visible errors/loading/success, and Save access with the mobile keyboard.

Daily dashboard totals/goals arrive in Phase 4; the history calendar and streaks arrive in Phase 5.

## Phase 4 — dashboard and goals

Run `supabase/migrations/202610120003_daily_goals.sql` once in SQL Editor after migrations 001 and 002. It adds owner-only goal history and an authenticated, RLS-preserving daily-total function. Open `/dashboard` to see consumed/goal/remaining/progress and meal groups. The summary covers all saved entries, including entries beyond the visible page. Open `/settings` to save a goal and effective date. A second save for that date replaces that row; earlier dates retain their goals.

Typecheck, lint and all 30 tests pass. The production build remains blocked by Turbopack worker-port permissions after the approved retry. Live database and browser checks remain pending:

1. Apply migration 003 and run `supabase/tests/daily_goals.sql` in SQL Editor. It rolls back its test users/data, checks RLS in both directions, rejects ownership transfer and nonpositive goals, verifies same-date upserts/historical goals, and tests exact totals for 25 entries plus edit/delete changes.
2. Compare a day before and after your goal's effective date on Dashboard; verify the 2,000 fallback before your first goal.
3. Log, edit and delete from Dashboard/Food and check the summary refreshes. Exceed your goal; remaining becomes negative and progress text exceeds 100%.
4. Check Today/Food/Settings navigation, loading/error/success states, and 320/375/768/desktop layouts. History remains unavailable until Phase 5.

## Phase 5 — history, timezone and streaks

Run `supabase/migrations/202610120004_history.sql` once in SQL Editor after migrations 001–003. Settings now lets you edit your display name and IANA timezone. The History tab opens a month calendar with logged-day markers, day totals/effective goals and paginated editable logs. Dashboard and History show current and longest streaks. Current streak ends today or yesterday when today is unfinished; future logs do not contribute yet.

Changing timezone does not rewrite saved log dates. Editing an old entry recalculates its saved date using the current timezone. History always groups by saved dates. Keyboard users can Tab to calendar dates, use arrows/Home/End to move focus, and Enter to select a day.

Typecheck, lint and all 38 tests pass. Production-build verification remains blocked by the previously observed Turbopack worker-port permissions; it was not rerun this phase. Live/database/browser verification is pending:

1. Apply migration 004. Run `supabase/tests/history.sql` in SQL Editor; it rolls back test data and checks aggregate isolation, distinct-date cursor behavior, profile ownership, stable saved dates after timezone changes, explicit edited-date recalculation, and removal of a day's last logged entry.
2. Change timezone and display name in Settings. Verify your greeting changes, new consumption times use the selected zone, and existing calendar markers stay on their original saved dates.
3. Browse months/dates, check effective goals and full totals, edit/delete earlier entries, and ensure calendar markers and streaks refresh.
4. Verify today/yesterday streaks, longest older streaks, duplicate logs on a day, missing days and removal of the day's last entry.
5. Check calendar keyboard controls, focus, labels, loading/error/success states and 320/375/768/desktop layouts. Run the production build locally before the Phase 6 gate.
