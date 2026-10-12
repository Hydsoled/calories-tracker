# Architecture — Calorie Tracker

## Stack
- Next.js App Router, TypeScript strict mode
- Tailwind CSS, shadcn/ui, Lucide React
- Supabase Auth, PostgreSQL, `@supabase/ssr`
- Zod for boundary validation; React Hook Form for complex forms
- Vitest for unit tests; Playwright for end-to-end tests
- Vercel deployment

## Architectural rules
- Prefer React Server Components for page composition and initial reads.
- Use Client Components for search, quantity controls, dialogs, and live previews.
- Perform mutations in Server Actions or route handlers with server-side auth and Zod validation.
- Keep domain calculations pure and independent of React or Supabase.
- Use Supabase RLS as a second security boundary, not as a substitute for input validation.
- Never trust browser-supplied `user_id`, prices, or ownership metadata.

## Suggested layout
```text
src/
  app/
    (auth)/login/ register/ forgot-password/
    (app)/dashboard/ food/ history/ settings/
    auth/callback/
    layout.tsx page.tsx globals.css
  components/
    ui/ layout/ dashboard/ food/ history/ shared/
  lib/
    supabase/client.ts server.ts proxy.ts
    nutrition/calculations.ts nutrition/providers.ts
    dates/local-day.ts streaks/calculate.ts
    validations/
  actions/
  types/
supabase/migrations/
supabase/seed.sql
docs/
```
Adjust names to the existing project and the installed Next.js version; do not reorganize working code merely to match this tree.

## Data flow
1. Server renders authenticated page after checking `supabase.auth.getUser()`.
2. Server queries only the relevant user's rows under RLS.
3. Client selects a catalog food, changes quantities, and previews calculations using shared pure utilities.
4. Server mutation revalidates inputs, derives identity from the session, calculates or validates the snapshot, and inserts/updates the entry.
5. Revalidate relevant dashboard/history routes and refresh client state after success.

## Authentication
- Use the official `@supabase/ssr` browser/server client patterns for the installed versions.
- Configure session cookie refresh in the appropriate Next.js request boundary (`proxy.ts` or `middleware.ts`, depending on version).
- Protect data in server code, not only through UI redirects.
- Use a dedicated callback/confirmation flow for email verification and password recovery.
- Never expose Supabase service-role secrets in client bundles.

## Nutrition integration
Define an adapter interface such as:
```ts
interface NutritionResult {
  providerId?: string;
  name: string;
  nameKa?: string;
  unit: 'g' | 'ml' | 'piece' | 'serving';
  caloriesPerUnit: number;
  referenceQuantity: number;
  source: string;
  estimated: boolean;
}
```
- Convert provider-specific results into this normalized shape.
- A 100 g reference uses `unit: 'g'`, `referenceQuantity: 100`.
- A per-piece reference uses `unit: 'piece'`, `referenceQuantity: 1`.
- Formula: `quantity / referenceQuantity * caloriesPerUnit`.
- Cache provider lookups; gracefully degrade to local/custom foods when unavailable.
- Do not automatically send personal food history to third-party providers.

## Date/time model
- Persist `consumed_at` as `timestamptz` in UTC.
- Persist each user's IANA timezone in `profiles.timezone`.
- Determine calendar-day boundaries using that timezone; do not group by UTC date.
- Prefer date-range queries computed from local midnight boundaries converted to UTC.
- Test DST boundaries and timezone changes.

## Performance
- Debounce search input (~250–350 ms).
- Return limited/paginated food results.
- Index entry queries by `(user_id, consumed_at)`.
- Fetch only requested calendar ranges.
- Keep interactive bundles small and avoid redundant client caches.

## Error handling and observability
- Show actionable errors for failed saves/searches, not raw SQL exceptions.
- Prevent duplicate submissions.
- Log structured server errors without sensitive user information.
- Add error boundaries, loading skeletons, and empty states.

## Quality gates
- Typecheck, lint, unit tests, and production build before merging.
- Integration-test RLS using at least two different authenticated users.
- End-to-end-test login, logging, overrides, history, and deletion.

## Environment
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Optional server-only nutrition integration
NUTRITION_API_KEY=
```
Match environment variable names to the installed Supabase SDK; older projects may use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
