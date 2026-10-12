import { Suspense } from "react";
import Link from "next/link";
import { z } from "zod";
import { getFoodPageData } from "@/lib/data/food-entries";
import { FoodSearch } from "@/components/food/food-search";
import { FoodEntryCard } from "@/components/food/food-entry-card";

type Params = Promise<{ page?: string; date?: string }>;
async function FoodContent({ searchParams }: { searchParams: Params }) {
  const query = await searchParams;
  const page = z.coerce.number().int().min(1).max(10000).catch(1).parse(query.page ?? 1);
  const data = await getFoodPageData(page, query.date);
  return <>
    <FoodSearch defaultTime={data.defaultTime} timezone={data.timezone} />
    <section className="mt-8 space-y-4" aria-labelledby="entries-title"><h2 id="entries-title" className="text-lg font-semibold">Entries for {data.day}</h2><p className="text-sm text-muted-foreground">Profile timezone: {data.timezone}. Choose a date to review or edit earlier entries.</p>
      <form method="get" className="flex flex-wrap items-end gap-2"><div><label htmlFor="log-date" className="block text-sm font-medium">View date</label><input id="log-date" name="date" type="date" min="1900-01-01" required defaultValue={data.day} className="min-h-11 max-w-full rounded-xl border border-border bg-card px-3" /></div><button className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold">View entries</button></form>
      {data.error ? <p role="alert" className="text-destructive">{data.error}</p> : data.entries.length === 0 ? <p className="rounded-2xl border border-border bg-card p-5">{page === 1 ? "No foods logged yet. Add your first meal." : "No more entries on this page."}</p> : <ul className="space-y-3">{data.entries.map((entry) => <li key={entry.id}><FoodEntryCard entry={entry} timezone={data.timezone} /></li>)}</ul>}
      <nav aria-label="Food entry pages" className="flex gap-4">{page > 1 && <Link href={`/food?date=${data.day}&page=${page - 1}`} className="inline-flex min-h-11 items-center underline">Previous</Link>}{data.hasMore && <Link href={`/food?date=${data.day}&page=${page + 1}`} className="inline-flex min-h-11 items-center underline">Next</Link>}</nav>
    </section>
  </>;
}
export default function FoodPage({ searchParams }: { searchParams: Params }) {
  return <><header className="mb-6 flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Log food</h1><Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm underline">Today</Link></header><Suspense fallback={<p role="status">Loading foods and your entries…</p>}><FoodContent searchParams={searchParams} /></Suspense></>;
}
