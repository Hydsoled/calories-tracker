import { Suspense } from "react";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/supabase/require-user";
import { getFoodPageData } from "@/lib/data/food-entries";
import { getEffectiveGoal } from "@/lib/data/goals";
import { dailyTotalSchema } from "@/lib/nutrition/daily-summary";
import { CalorieProgress } from "@/components/dashboard/calorie-progress";
import { FoodEntryCard } from "@/components/food/food-entry-card";
import { FoodEditorButton } from "@/components/food/food-editor-button";

type Params = Promise<{ date?: string; page?: string }>;
async function DashboardContent({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const page = z.coerce.number().int().min(1).max(10000).catch(1).parse(params.page ?? 1);
  const { supabase, user } = await requireUser();
  const data = await getFoodPageData(page, params.date);
  const [goal, total] = await Promise.all([
    getEffectiveGoal(supabase, user.id, data.day),
    supabase.rpc("daily_food_total", { selected_date: data.day }),
  ]);
  const parsedTotal = dailyTotalSchema.safeParse(total.data);
  const summaryError = goal.error || (total.error || !parsedTotal.success ? "Could not load the daily total. Apply the latest migration and try again." : undefined);
  return <>
    <header className="mb-6"><h1 className="text-2xl font-semibold">Your daily journal</h1><p className="mt-1 text-sm text-muted-foreground">Welcome back · {data.day} · {data.timezone}</p></header>
    <form method="get" className="mb-6 flex flex-wrap items-end gap-2"><div><label htmlFor="dashboard-date" className="block text-sm font-medium">View date</label><input id="dashboard-date" name="date" type="date" min="1900-01-01" required defaultValue={data.day} className="min-h-11 max-w-full rounded-xl border border-border bg-card px-3" /></div><Button variant="outline">View day</Button><Button asChild variant="outline"><Link href="/dashboard">Today</Link></Button></form>
    {summaryError ? <p role="alert" className="rounded-2xl border border-border bg-card p-5 text-destructive">{summaryError}</p> : parsedTotal.success && <CalorieProgress consumed={parsedTotal.data} goal={goal.goal} />}
    <div className="my-6 flex flex-wrap gap-3"><Button asChild><Link href={`/food?date=${data.day}`}>Add Food</Link></Button><FoodEditorButton mode="quick_add" defaultTime={data.defaultTime} timezone={data.timezone}>Quick Add</FoodEditorButton></div>
    <section aria-labelledby="daily-entries-title"><h2 id="daily-entries-title" className="mb-4 text-lg font-semibold">Food log</h2>{data.error ? <p role="alert" className="text-destructive">{data.error}</p> : !data.entries.length ? <p className="rounded-2xl border border-border bg-card p-5">{page === 1 ? "No foods logged yet. Add your first meal." : "No more entries on this page."}</p> : ["breakfast", "lunch", "dinner", "snack"].map((meal) => {
      const entries = data.entries.filter((entry) => entry.meal_type === meal);
      return entries.length > 0 && <section key={meal} className="mb-6"><h3 className="mb-2 font-medium capitalize">{meal}</h3><ul className="space-y-3">{entries.map((entry) => <li key={entry.id}><FoodEntryCard entry={entry} timezone={data.timezone} /></li>)}</ul></section>;
    })}<nav aria-label="Daily food log pages" className="flex gap-4">{page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={`/dashboard?date=${data.day}&page=${page - 1}`}>Previous</Link>}{data.hasMore && <Link className="inline-flex min-h-11 items-center underline" href={`/dashboard?date=${data.day}&page=${page + 1}`}>Next</Link>}</nav></section>
  </>;
}
export default function Dashboard({ searchParams }: { searchParams: Params }) {
  return <Suspense fallback={<p role="status">Loading your dashboard…</p>}><DashboardContent searchParams={searchParams} /></Suspense>;
}
