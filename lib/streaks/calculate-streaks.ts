import { calendarDaySchema } from "../dates/local-day.ts";
import { shiftDay } from "../dates/calendar.ts";
export function calculateStreaks(loggedDates: readonly string[], today: string) {
  calendarDaySchema.parse(today);
  const dates = [...new Set(loggedDates.map((day) => calendarDaySchema.parse(day)))].filter((day) => day <= today).sort();
  const logged = new Set(dates);
  let current = 0;
  let cursor = logged.has(today) ? today : shiftDay(today, -1);
  while (logged.has(cursor)) { current++; cursor = shiftDay(cursor, -1); }
  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of dates) {
    run = previous && shiftDay(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return { current, longest };
}
