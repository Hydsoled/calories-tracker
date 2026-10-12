import { z } from "zod";
import { requireUser } from "../supabase/require-user";
import { localDay, calendarDaySchema } from "../dates/local-day";
import { getProfile } from "./profile";
import { calculateStreaks } from "../streaks/calculate-streaks";
export async function getStreakData() {
  const { supabase } = await requireUser();
  const { timezone } = await getProfile();
  const today = localDay(new Date(), timezone);
  const dates: string[] = [];
  let before: string | null = null;
  while (true) {
    const result = await supabase.rpc("logged_food_dates", { before_date: before }).lte("local_date", today).order("local_date", { ascending: false }).limit(500);
    if (result.error) return { error: "Could not load streaks. Apply the history migration and try again.", current: 0, longest: 0 };
    const rows = z.array(z.object({ local_date: calendarDaySchema })).parse(result.data);
    dates.push(...rows.map((row) => row.local_date));
    if (rows.length < 500) break;
    before = rows[rows.length - 1].local_date;
  }
  return { ...calculateStreaks(dates, today), error: undefined };
}
