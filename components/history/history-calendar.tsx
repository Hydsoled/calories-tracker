"use client";
import Link from "next/link";
import { monthDays, shiftMonth } from "@/lib/dates/calendar";
import type { KeyboardEvent } from "react";
export function HistoryCalendar({ month, selectedDate, today, loggedDays }: { month: string; selectedDate: string; today: string; loggedDays?: string[] }) {
  const days = monthDays(month);
  const blanks = new Date(`${month}-01T00:00:00Z`).getUTCDay();
  const heading = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  const logged = new Set(loggedDays ?? []);
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a[data-calendar-day]")];
    const index = links.findIndex((link) => link === event.target);
    if (index < 0) return;
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : offsets[event.key] !== undefined ? index + offsets[event.key] : undefined;
    if (next === undefined) return;
    event.preventDefault();
    links[Math.max(0, Math.min(links.length - 1, next))]?.focus();
  }
  return <section className="rounded-2xl border border-border bg-card p-3 sm:p-5" aria-label="Food history calendar"><header className="mb-4 flex items-center justify-between gap-2">{month > "1900-01" ? <Link href={`/history?month=${shiftMonth(month, -1)}`} aria-label="Previous month" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border">←</Link> : <span className="size-11" />}<h2 className="text-center font-semibold">{heading}</h2>{month < "9999-12" ? <Link href={`/history?month=${shiftMonth(month, 1)}`} aria-label="Next month" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border">→</Link> : <span className="size-11" />}</header><div className="grid grid-cols-7 text-center text-xs text-muted-foreground" aria-hidden>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-2">{day}</span>)}</div><div className="grid grid-cols-7 gap-1" onKeyDown={navigate}>{Array.from({ length: blanks }, (_, index) => <span key={`blank-${index}`} />)}{days.map((day) => <Link data-calendar-day key={day} href={`/history?month=${month}&date=${day}`} aria-current={day === selectedDate ? "date" : undefined} aria-label={`${day}${day === today ? ", today" : ""}${loggedDays === undefined ? ", logging status unavailable" : logged.has(day) ? ", food logged" : ", no food logged"}`} className={`flex min-h-11 flex-col items-center justify-center rounded-lg text-sm ${day === selectedDate ? "bg-primary text-primary-foreground" : day === today ? "border border-primary" : "hover:bg-muted"}`}><span>{Number(day.slice(-2))}</span><span className="h-2 text-[8px] leading-none" aria-hidden>{logged.has(day) ? "●" : ""}</span></Link>)}</div><p className="mt-3 text-xs text-muted-foreground">{loggedDays === undefined ? "Logging markers unavailable." : "● Food logged."} Use arrow keys to move between dates and Enter to select.</p></section>;
}
