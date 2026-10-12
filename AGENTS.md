# AGENTS.md

## Project Overview

This project is a mobile-first calorie tracking application built with Next.js and Supabase.

Users can authenticate, set daily calorie goals, search and log foods, adjust quantities and calorie values, view consumption history, and track daily logging streaks.

The application should be fast, intuitive, visually polished, and production-ready.

## Tech Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **Validation:** Zod
- **Forms:** React Hook Form
- **Charts:** Recharts

Use existing dependencies and established project patterns before introducing new libraries.

## Coding Standards

- Write clean, maintainable, strongly typed TypeScript.
- Avoid `any`, duplicated code, and unnecessary abstractions.
- Prefer Server Components; use Client Components only for interactive functionality.
- Keep database operations and business logic separate from UI components.
- Create reusable components for repeated UI patterns.
- Follow Next.js App Router conventions.
- Use descriptive naming and consistent file organization.
- Handle loading, empty, error, and success states.
- Avoid modifying unrelated code.
- Do not overengineer simple features.

## UI/UX Guidelines

- Always design mobile-first.
- Use Tailwind CSS and shadcn/ui consistently.
- Maintain a clean, modern, minimalist visual style.
- Use consistent spacing, typography, colors, and rounded corners.
- Prioritize fast food logging and intuitive navigation.
- Use bottom navigation on mobile where appropriate.
- Ensure responsive layouts across mobile, tablet, and desktop.
- Support keyboard navigation and accessible form controls.
- Avoid unnecessary animations and visual clutter.

## Supabase & Security

- Use Supabase Auth for authentication.
- Use `@supabase/ssr` for server-side session management.
- Protect authenticated routes and server-side operations.
- Enable Row Level Security on user-owned database tables.
- Always verify resource ownership before mutations.
- Never trust client-provided user IDs.
- Never expose service-role keys or private credentials.
- Validate user inputs with Zod.
- Use SQL migrations for database schema changes.
- Preserve historical records when food defaults or goals change.

## Business Logic

- Support foods measured in grams, milliliters, pieces, and servings.
- Automatically calculate calories based on quantity and nutritional values.
- Allow users to override calories for individual food entries.
- Support English and Georgian food names.
- Store calorie values as snapshots in food logs.
- Calculate daily totals using the user's timezone.
- Allow users to configure their daily calorie goals.
- Calculate streaks from consecutive calendar days with food entries.
- Do not count the current unfinished day as a broken streak.
- Keep calorie calculations and streak logic in reusable, testable utilities.
- Treat external nutritional values as estimates unless verified.

## Performance

- Minimize unnecessary client-side JavaScript.
- Prefer server-side data fetching.
- Debounce food search requests.
- Avoid unnecessary database queries and rerenders.
- Paginate large datasets.
- Optimize mobile performance.

## Development Workflow

Before implementing a feature:

1. Inspect the existing code and relevant documentation.
2. Follow established architecture and naming conventions.
3. Plan significant changes before implementing them.
4. Implement the smallest complete solution.
5. Add appropriate validation, error handling, and loading states.
6. Add or update tests for important business logic.
7. Run available TypeScript, lint, and test checks.
8. Report what changed and any checks that could not be completed.

Do not claim tests passed unless they were actually executed.

## Documentation

Consult relevant documentation when available:

- `docs/PRODUCT.md` — Product requirements and feature behavior.
- `docs/ARCHITECTURE.md` — Application architecture and technical decisions.
- `docs/DATABASE.md` — Database schema, relationships, and RLS policies.
- `docs/DESIGN.md` — UI components, design tokens, and responsive guidelines.

Do not assume these documents exist. If documentation is missing, inspect the existing implementation and ask for clarification only when necessary.

Keep documentation synchronized with significant architectural or business-rule changes.

## Core Principle

**Food logging must be fast, simple, and reliable.**

Prioritize usability, accurate calculations, data security, and maintainable code over unnecessary complexity.