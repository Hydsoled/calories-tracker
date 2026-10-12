import Link from "next/link";
import { getStreakData } from "@/lib/data/streaks";
export async function StreakCounter() {
  const result = await getStreakData();
  return <section className="my-6 rounded-2xl border border-border bg-card p-5" aria-labelledby="streak-title"><h2 id="streak-title" className="font-semibold">Logging consistency</h2>{result.error ? <p role="alert" className="mt-2 text-sm text-destructive">{result.error}</p> : <><p className="mt-2">Current streak: <strong>{result.current} {result.current === 1 ? "day" : "days"}</strong></p><p className="text-sm text-muted-foreground">Longest streak: {result.longest} days. Streaks measure logging, regardless of your goal. Today’s unfinished day does not break a streak.</p></>}<Link href="/history" className="mt-2 inline-flex min-h-11 items-center text-sm underline">View history</Link></section>;
}
