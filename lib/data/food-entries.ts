import { getProfile } from "./profile";
import { requireUser } from "../supabase/require-user";
import { calendarDaySchema, localDay, localDateTime } from "../dates/local-day";
import { foodEntryRowSchema } from "./food-entry-model";

export async function getFoodPageData(page: number, selectedDate?: string) {
  const { supabase, user } = await requireUser();
  const { timezone } = await getProfile();
  const now = new Date();
  const selected = calendarDaySchema.safeParse(selectedDate);
  const day = selected.success ? selected.data : localDay(now, timezone);
  const defaultTime = `${day}T${localDateTime(now, timezone).slice(11)}`;
  const result = await supabase.from("food_entries").select("*", { count: "exact" })
    .eq("user_id", user.id).eq("local_date", day)
    .order("consumed_at", { ascending: false }).order("id", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (result.error) return { timezone, day, defaultTime, entries: [], hasMore: false, error: "Could not load food entries. Apply the food_entries migration and try again." };
  return {
    timezone, day, defaultTime,
    entries: result.data.map((row) => foodEntryRowSchema.parse(row)),
    hasMore: (result.count ?? 0) > page * 20, error: undefined,
  };
}
