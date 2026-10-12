import { calendarDaySchema } from "./local-day.ts";
export function shiftDay(day: string, amount: number): string {
  calendarDaySchema.parse(day);
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function monthDays(month: string): string[] {
  calendarDaySchema.parse(`${month}-01`);
  const start = new Date(`${month}-01T00:00:00Z`);
  const last = new Date(start);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  return Array.from({ length: last.getUTCDate() }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}
export function shiftMonth(month: string, amount: number): string {
  calendarDaySchema.parse(`${month}-01`);
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}
