import { z } from "zod";

export const calendarDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((day) => {
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day && Number(day.slice(0, 4)) >= 1900;
}, "Choose a valid calendar date.");

export const timezoneSchema = z.string().refine((zone) => {
  if (/^[+-]/.test(zone)) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: zone }); return true; }
  catch { return false; }
}, "Choose a valid IANA timezone.");

export function localDateTime(instant: string | Date, timezone: string): string {
  timezoneSchema.parse(timezone);
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid consumption timestamp.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
export function localDay(instant: string | Date, timezone: string): string {
  return localDateTime(instant, timezone).slice(0, 10);
}

/** Interpret wall-clock input in the profile timezone, never the browser/server zone.
 * DST gaps are rejected; repeated times choose the earlier matching instant.
 */
export function consumptionInstant(wallTime: string, timezone: string): string {
  timezoneSchema.parse(timezone);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wallTime)) throw new Error("Choose a valid date and time.");
  const nominal = new Date(`${wallTime}:00Z`);
  if (!Number.isFinite(nominal.getTime()) || nominal.toISOString().slice(0, 16) !== wallTime || Number(wallTime.slice(0, 4)) < 1900) {
    throw new Error("Choose a valid date and time from 1900 onward.");
  }
  const offsets = new Set<number>();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const sample = nominal.getTime() + hours * 3600000;
    const local = localDateTime(new Date(sample), timezone);
    offsets.add(new Date(`${local}:00Z`).getTime() - sample);
  }
  const candidates = [...offsets].map((offset) => nominal.getTime() - offset)
    .filter((value) => localDateTime(new Date(value), timezone) === wallTime).sort((a, b) => a - b);
  if (!candidates.length) throw new Error("This local time does not exist because the clocks change. Choose another time.");
  return new Date(candidates[0]).toISOString();
}
