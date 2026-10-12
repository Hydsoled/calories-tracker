"use client";
import { useActionState } from "react";
import { saveGoal } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GoalState } from "@/lib/validations/goals";
export function GoalEditor({ goal, day }: { goal: number; day: string }) {
  const [state, action, pending] = useActionState(saveGoal, {} as GoalState);
  return <form action={action} className="space-y-4"><div><label htmlFor="calorieGoal" className="block text-sm font-medium">Daily calorie goal (kcal)</label><Input id="calorieGoal" name="calorieGoal" type="number" inputMode="numeric" min="1" max="2147483647" step="1" required defaultValue={goal} aria-invalid={!!state.fields?.calorieGoal} aria-describedby="goal-help goal-error" /><p id="goal-error" className="text-sm text-destructive">{state.fields?.calorieGoal}</p></div><div><label htmlFor="effectiveDate" className="block text-sm font-medium">Effective from</label><Input id="effectiveDate" name="effectiveDate" type="date" min="1900-01-01" required defaultValue={day} aria-invalid={!!state.fields?.effectiveDate} aria-describedby="date-help date-error" /><p id="date-error" className="text-sm text-destructive">{state.fields?.effectiveDate}</p><p id="date-help" className="mt-2 text-sm text-muted-foreground">Applies from this date until your next goal change. Earlier dates keep their goals. Saving again for the same date replaces that date’s goal.</p></div><p id="goal-help" className="text-sm text-muted-foreground">A goal is a reference target, not a judgment or medical recommendation. The default is 2,000 kcal.</p>{state.error && <p role="alert" className="text-destructive">{state.error}</p>}{state.success && <p role="status">{state.success}</p>}<Button disabled={pending}>{pending ? "Saving…" : "Save goal"}</Button></form>;
}
