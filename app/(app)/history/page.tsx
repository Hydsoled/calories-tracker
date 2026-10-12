import { Suspense } from "react";
import Link from "next/link";
import { getHistoryData } from "@/lib/data/history";
import { HistoryCalendar } from "@/components/history/history-calendar";
import { CalorieProgress } from "@/components/dashboard/calorie-progress";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { FoodEntryCard } from "@/components/food/food-entry-card";
import { FoodEditorButton } from "@/components/food/food-editor-button";
import { Button } from "@/components/ui/button";
type Params = Promise<{ month?: string; date?: string; page?: string }>;
async function HistoryContent({ searchParams }: { searchParams: Params }) {
  const history = await getHistoryData(await searchParams);
  const { data, goal, month, selectedDate, page } = history;
  const total = history.rows.find((row) => row.local_date === selectedDate)?.total_calories ?? 0;
  return <div className="space-y-6"><HistoryCalendar month={month} today={history.today} selectedDate={selectedDate} loggedDays={history.error ? undefined : history.rows.map((row) => row.local_date)} />{history.error && <p role="alert" className="text-destructive">{history.error}</p>}<section aria-labelledby="history-day-title"><h2 id="history-day-title" className="mb-4 text-lg font-semibold">{selectedDate} · {data.timezone}</h2>{goal.error ? <p role="alert" className="text-destructive">{goal.error}</p> : !history.error && <CalorieProgress consumed={total} goal={goal.goal} />}<div className="my-4 flex flex-wrap gap-2"><Button asChild><Link href={`/food?date=${selectedDate}`}>Add Food</Link></Button><FoodEditorButton mode="quick_add" defaultTime={data.defaultTime} timezone={data.timezone}>Quick Add</FoodEditorButton></div>{data.error ? <p role="alert" className="text-destructive">{data.error}</p> : !data.entries.length ? <p className="rounded-2xl border border-border bg-card p-5">{page === 1 ? "No foods logged on this day." : "No more entries on this page."}</p> : <ul className="space-y-3">{data.entries.map((entry) => <li key={entry.id}><FoodEntryCard entry={entry} timezone={data.timezone} /></li>)}</ul>}<nav aria-label="History entry pages" className="mt-4 flex gap-4">{page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={`/history?month=${month}&date=${selectedDate}&page=${page - 1}`}>Previous</Link>}{data.hasMore && <Link className="inline-flex min-h-11 items-center underline" href={`/history?month=${month}&date=${selectedDate}&page=${page + 1}`}>Next</Link>}</nav></section><Suspense fallback={<p role="status">Loading streaks…</p>}><StreakCounter /></Suspense></div>;
}
export default function HistoryPage({ searchParams }: { searchParams: Params }) {
  return <><h1 className="mb-6 text-2xl font-semibold">History</h1><Suspense fallback={<p role="status">Loading history…</p>}><HistoryContent searchParams={searchParams} /></Suspense></>;
}
