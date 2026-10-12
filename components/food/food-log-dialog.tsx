"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveFoodEntry } from "@/actions/food-entries";
import { createFoodSnapshot } from "@/lib/nutrition/create-food-snapshot";
import { editFoodSnapshot } from "@/lib/nutrition/edit-food-snapshot";
import { foodEntryInputSchema, foodUnitSchema, mealTypeSchema } from "@/lib/validations/food-entry";
import type { FoodMutationState } from "@/lib/validations/food-log";
import type { FoodEntryRow } from "@/lib/data/food-entry-model";
import type { BuiltInFood, FoodUnit, MealType } from "@/types/food";

type Props = {
  mode: "catalog" | "custom" | "quick_add";
  food?: BuiltInFood;
  original?: FoodEntryRow;
  defaultTime: string;
  timezone: string;
  onClose: (message?: string) => void;
};
export function FoodLogDialog({ mode, food, original, defaultTime, timezone, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [quantity, setQuantity] = useState(String(original?.quantity ?? food?.baseQuantity ?? 1));
  const [rate, setRate] = useState(String(original?.calories_per_base_quantity ?? food?.caloriesPerBaseQuantity ?? 0));
  const [base, setBase] = useState(String(original?.base_quantity ?? food?.baseQuantity ?? 100));
  const [unit, setUnit] = useState<FoodUnit>(original?.unit ?? food?.unit ?? "g");
  const [name, setName] = useState(original?.food_name ?? "");
  const [meal, setMeal] = useState<MealType>(original?.meal_type ?? "snack");
  const [time, setTime] = useState(defaultTime);
  const [override, setOverride] = useState(original?.is_total_override ?? false);
  const [total, setTotal] = useState(String(original?.total_calories ?? ""));
  const [state, action, pending] = useActionState(saveFoodEntry.bind(null, original?.id ?? null), {} as FoodMutationState);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialog.current?.showModal();
    return () => { if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);
  useEffect(() => { if (state.success) onClose(state.success); }, [state.success, onClose]);
  const entry = mode === "quick_add"
    ? { entryType: mode, foodName: name, totalCalories: total, mealType: meal }
    : mode === "catalog"
      ? { entryType: mode, catalogFoodId: original?.catalog_food_id ?? food?.id, quantity, caloriesPerBaseQuantity: rate, mealType: meal, ...(override ? { totalOverride: total } : {}) }
      : { entryType: mode, foodName: name, quantity, unit, baseQuantity: base, caloriesPerBaseQuantity: rate, mealType: meal, ...(override ? { totalOverride: total } : {}) };
  let preview: number | undefined;
  try {
    const validated = foodEntryInputSchema.parse(entry);
    preview = (original ? editFoodSnapshot(original, validated) : createFoodSnapshot(validated)).totalCalories;
  } catch { /* Show no preview until the draft is valid; submission gives field errors. */ }
  const fieldError = (field: string) => state.fields?.[`entry.${field}`];
  function numberField(label: string, field: string, value: string, change: (value: string) => void, positive = false) {
    return <div className="space-y-1"><label htmlFor={field} className="text-sm font-medium">{label}</label><Input id={field} type="number" inputMode="decimal" min={positive ? "0.001" : "0"} max="999999999.999" step="0.001" required value={value} onChange={(e) => change(e.target.value)} aria-invalid={!!fieldError(field)} aria-describedby={fieldError(field) ? `${field}-error` : undefined} />{fieldError(field) && <p id={`${field}-error`} className="text-sm text-destructive">{fieldError(field)}</p>}</div>;
  }
  return <dialog ref={dialog} onCancel={(event) => { if (pending) event.preventDefault(); }} onClose={() => onClose()} aria-labelledby="food-dialog-title" className="food-dialog border border-border bg-card text-foreground shadow-xl">
    <div className="p-5 sm:p-6"><header className="mb-5 flex items-start justify-between gap-3"><h2 id="food-dialog-title" className="text-xl font-semibold">{original ? "Edit food entry" : mode === "catalog" ? food?.name : mode === "custom" ? "Custom food" : "Quick Add"}</h2><Button variant="outline" type="button" disabled={pending} onClick={() => dialog.current?.close()} aria-label="Close food form">Close</Button></header>
    <form action={action} className="space-y-4">
      <input type="hidden" name="payload" value={JSON.stringify({ entry, consumedLocalTime: time })} />
      <fieldset disabled={pending} className="space-y-4">
        {mode !== "catalog" && <div className="space-y-1"><label htmlFor="foodName" className="text-sm font-medium">{mode === "quick_add" ? "Description (optional)" : "Food name"}</label><Input id="foodName" value={name} maxLength={200} required={mode === "custom"} onChange={(e) => setName(e.target.value)} aria-invalid={!!fieldError("foodName")} aria-describedby={fieldError("foodName") ? "foodName-error" : undefined} />{fieldError("foodName") && <p id="foodName-error" className="text-sm text-destructive">{fieldError("foodName")}</p>}</div>}
        {mode !== "quick_add" && <>
          {numberField(`Quantity (${unit})`, "quantity", quantity, setQuantity, true)}
          <div className="flex gap-2"><Button type="button" variant="outline" aria-label="Decrease quantity" onClick={() => setQuantity(String(Math.max(0.001, Number((Number(quantity) - (unit === "g" || unit === "ml" ? 10 : 1)).toFixed(3)))))}>−</Button><Button type="button" variant="outline" aria-label="Increase quantity" onClick={() => setQuantity(String(Number((Number(quantity) + (unit === "g" || unit === "ml" ? 10 : 1)).toFixed(3))))}>+</Button></div>
          {mode === "custom" && <><div className="space-y-1"><label htmlFor="unit" className="text-sm font-medium">Unit</label><select id="unit" value={unit} onChange={(e) => setUnit(foodUnitSchema.parse(e.target.value))} className="min-h-11 w-full rounded-xl border border-border bg-card px-3">{["g", "ml", "piece", "serving"].map((value) => <option key={value}>{value}</option>)}</select></div>{numberField("Reference quantity", "baseQuantity", base, setBase, true)}</>}
          {numberField(`Calories per ${base} ${unit}`, "caloriesPerBaseQuantity", rate, setRate)}
          <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={override} onChange={(e) => { setOverride(e.target.checked); if (e.target.checked && total === "" && preview !== undefined) setTotal(String(preview)); }} />Override total calories</label>
          {override && <Button type="button" variant="outline" onClick={() => setOverride(false)}>Use calculated total</Button>}
        </>}
        {(mode === "quick_add" || override) && numberField(mode === "quick_add" ? "Total calories" : "Manual total calories", mode === "quick_add" ? "totalCalories" : "totalOverride", total, setTotal)}
        <div className="space-y-1"><label htmlFor="meal" className="text-sm font-medium">Meal</label><select id="meal" value={meal} onChange={(e) => setMeal(mealTypeSchema.parse(e.target.value))} className="min-h-11 w-full rounded-xl border border-border bg-card px-3">{["breakfast", "lunch", "dinner", "snack"].map((value) => <option key={value}>{value}</option>)}</select></div>
        <div className="space-y-1"><label htmlFor="consumedLocalTime" className="text-sm font-medium">Date and time ({timezone})</label><Input id="consumedLocalTime" type="datetime-local" min="1900-01-01T00:00" required value={time} onChange={(e) => setTime(e.target.value)} aria-describedby="time-help" /><p id="time-help" className="text-xs text-muted-foreground">Uses your profile timezone. Repeated clock-change times use the earlier occurrence.</p></div>
      </fieldset>
      <p role="status" className="text-lg font-semibold">{preview === undefined ? "Enter valid values to preview calories." : `${preview} kcal${override && mode !== "quick_add" ? " (manual total)" : ""}`}</p>
      <p className="text-xs text-muted-foreground">Use at most three decimal places. Calories are estimates and may vary by recipe or portion.</p>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <div className="sticky bottom-0 bg-card py-3"><Button className="w-full" disabled={pending || preview === undefined}>{pending ? "Saving…" : "Save food entry"}</Button></div>
    </form></div>
  </dialog>;
}
