import { z } from "zod";
import { requireUser } from "../supabase/require-user";
import { getProfile } from "./profile";
import { getFoodPageData } from "./food-entries";
import { getEffectiveGoal } from "./goals";
import { monthDays } from "../dates/calendar";
import { calendarDaySchema, localDay } from "../dates/local-day";
import { dailyTotalSchema } from "../nutrition/daily-summary";
export async function getHistoryData(params: { month?: string; date?: string; page?: string }) {
  const { supabase, user } = await requireUser();
  const profile = await getProfile();
  const today = localDay(new Date(), profile.timezone);
  const monthValid = calendarDaySchema.safeParse(`${params.month}-01`);
  const month = monthValid.success ? monthValid.data.slice(0, 7) : today.slice(0, 7);
  const days = monthDays(month);
  const requested = calendarDaySchema.safeParse(params.date);
  const selectedDate = requested.success && requested.data.startsWith(`${month}-`) ? requested.data : today.startsWith(`${month}-`) ? today : days[0];
  const page = z.coerce.number().int().min(1).max(10000).catch(1).parse(params.page ?? 1);
  const [data, goal, totals] = await Promise.all([
    getFoodPageData(page, selectedDate), getEffectiveGoal(supabase, user.id, selectedDate),
    supabase.rpc("monthly_food_totals", { month_start: days[0], month_end: days[days.length - 1] }),
  ]);
  const rows = totals.error ? [] : z.array(z.object({ local_date: calendarDaySchema, total_calories: dailyTotalSchema, entry_count: z.coerce.number().int().positive() })).parse(totals.data);
  return { data, goal, rows, month, days, selectedDate, page, today, error: totals.error ? "Could not load month totals. Apply the history migration and try again." : undefined };
}
