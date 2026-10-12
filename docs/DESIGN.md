# Design System — Calorie Tracker

## Experience principles
- Mobile-first, fast, uncluttered, and friendly without being childish.
- Logging a common food should take seconds and require minimal navigation.
- Never rely on color alone to convey goal status or streaks.
- Show useful numbers prominently; keep secondary metadata subdued.
- Avoid guilt-inducing language when users exceed goals.

## Visual tokens
Use semantic CSS variables that support light mode and future dark mode.

| Token | Suggested light value | Use |
|---|---|---|
| `--primary` | `#16A34A` | Main actions, progress |
| `--background` | `#F8FAF9` | App background |
| `--card` | `#FFFFFF` | Surfaces |
| `--foreground` | `#111827` | Primary text |
| `--muted-foreground` | `#6B7280` | Secondary text |
| `--border` | `#E5E7EB` | Dividers, input borders |
| `--destructive` | `#EF4444` | Destructive actions |

Use shadcn/ui theme tokens and verify accessible contrast, particularly for green-on-white text.

## Typography and spacing
- Use a modern sans-serif (e.g., Geist) with a consistent type scale.
- Body text typically 14–16 px; prominent daily calorie totals 28–36 px.
- Prefer a 4/8 px spacing rhythm.
- Cards: ~12–20 px radius, subtle borders, restrained shadows.
- Minimum practical touch target: 44×44 px.

## Responsive layout
- 320–767 px: single-column content and fixed bottom navigation (account for safe-area insets).
- 768–1023 px: wider content, optional two-column summaries.
- 1024+ px: centered content with sidebar and multi-column dashboard.
- Avoid horizontal scrolling and keep important actions above the fold where practical.
- Respect keyboard overlays and scroll position when entering food quantities.

## Navigation
Mobile bottom tabs: **Today**, **Food**, **History**, **Settings**. Highlight active destination and provide accessible labels. Desktop uses a sidebar with the same destinations.

## Screen specifications

### Landing
- Clear product value proposition, brief feature explanation, sign-up and sign-in actions.
- Avoid fake testimonials, usage numbers, or unverified claims.

### Authentication
- Single-column form with clear field labels and inline validation.
- Show loading and actionable error messages.
- Provide password recovery and switch between login/register.

### Dashboard
1. Date header and short greeting.
2. Large calorie progress card: consumed / goal, remaining, progress indicator.
3. Prominent Add Food action.
4. Today's food log grouped by meal.
5. Current streak and history shortcut.

Over-goal progress should remain visually legible; underlying values must not be capped.

### Food search and logging
- Search bar at top, with loading, no-results, and recent/favorite states when available.
- Each result shows name, optional Georgian name, estimated kcal and reference unit.
- Tap result to open a bottom sheet on mobile (dialog on desktop).
- Sheet shows quantity stepper/input, unit, calories per reference, computed total, manual override control, meal type, date/time, and Save.
- If manual total is entered, label it clearly and offer “Use calculated total” to reset.
- Keep Save accessible when mobile keyboard is visible.
- Display source/estimate disclosure where appropriate.

### History
- Compact month calendar with clear logged-day markers.
- Selecting a date shows total, effective goal, and entries.
- Provide accessible previous/next month controls.

### Settings
- Simple grouped controls for profile, calorie goal, timezone, and sign out.
- Explain that changing timezone can affect how historical logs are grouped.

## Components
Reuse shadcn/ui primitives. Suggested domain components:
- `CalorieProgress`
- `DailySummary`
- `FoodSearch`
- `FoodResultRow`
- `FoodLogSheet`
- `QuantitySelector`
- `FoodEntryCard`
- `GoalEditor`
- `StreakCounter`
- `HistoryCalendar`
- `MobileNavigation`

## States and accessibility
- Every screen needs loading, empty, error, and success behavior.
- Use skeletons for data loading; avoid layout shift.
- Show confirmation for destructive actions or offer undo when feasible.
- Keyboard focus must remain visible; dialogs/sheets must trap focus and restore it on close.
- Form fields need labels and error associations.
- Support reduced motion and avoid excessive animation.
- Test at 320 px, 375 px, 768 px, and desktop widths.

## Copy examples
- Empty today: “No foods logged yet. Add your first meal.”
- Over goal: “You've logged 120 kcal above today's goal.”
- Search empty: “No matches. Try another name or add a custom food.”
- Save success: “Food added to today.”
- Nutrition disclaimer: “Calories are estimates and may vary by recipe or portion.”
