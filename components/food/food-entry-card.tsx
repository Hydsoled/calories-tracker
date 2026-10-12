import { localDateTime } from "@/lib/dates/local-day";
import type { FoodEntryRow } from "@/lib/data/food-entry-model";
import { FoodEditorButton } from "./food-editor-button";
import { DeleteEntryButton } from "./delete-entry-button";
export function FoodEntryCard({ entry, timezone }: { entry: FoodEntryRow; timezone: string }) {
  const time = localDateTime(entry.consumed_at, timezone);
  return <article className="rounded-2xl border border-border bg-card p-4"><h3 className="break-words font-semibold">{entry.food_name}</h3><p className="mt-1 text-sm">{entry.total_calories} kcal{entry.is_total_override ? " · manual total" : ""}</p><p className="mt-1 text-sm text-muted-foreground">{entry.quantity !== null ? `${entry.quantity} ${entry.unit} · ` : ""}{entry.meal_type} · {time.slice(11)}</p><div className="mt-3 flex flex-wrap gap-2"><FoodEditorButton mode={entry.entry_type} original={entry} defaultTime={time} timezone={timezone}>Edit</FoodEditorButton><DeleteEntryButton id={entry.id} name={entry.food_name} /></div></article>;
}
