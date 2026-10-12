"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Utensils, Settings, History } from "lucide-react";
const destinations = [
  { href: "/dashboard", label: "Today", Icon: CalendarDays },
  { href: "/food", label: "Food", Icon: Utensils },
  { href: null, label: "History", Icon: History },
  { href: "/settings", label: "Settings", Icon: Settings },
];
export function AppNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:static md:mb-6 md:rounded-2xl md:border md:pb-0 lg:fixed lg:inset-auto lg:left-4 lg:top-8 lg:w-40"><ul className="grid grid-cols-4 lg:grid-cols-1">{destinations.map(({ href, label, Icon }) => <li key={label}>{href ? <Link href={href} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-xs lg:flex-row lg:justify-start lg:gap-3 lg:text-sm ${pathname === href ? "bg-muted font-semibold text-primary" : "text-muted-foreground"}`}><Icon className="size-5" aria-hidden />{label}</Link> : <span aria-disabled="true" title="History is coming in the next phase" className="flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-xs text-muted-foreground lg:flex-row lg:justify-start lg:gap-3 lg:text-sm"><Icon className="size-5" aria-hidden /><span>{label}<span className="sr-only"> — coming soon</span></span></span>}</li>)}</ul></nav>;
}
