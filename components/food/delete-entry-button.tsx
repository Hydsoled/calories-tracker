"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteFoodEntry } from "@/actions/food-entries";
import type { FoodMutationState } from "@/lib/validations/food-log";
export function DeleteEntryButton({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(deleteFoodEntry.bind(null, id), {} as FoodMutationState);
  return <form action={action} onSubmit={(event) => { if (!window.confirm(`Delete ${name}? This cannot be undone.`)) event.preventDefault(); }}><Button variant="outline" disabled={pending} className="text-destructive" aria-label={`Delete ${name}`}>{pending ? "Deleting…" : "Delete"}</Button>{state.error && <p role="alert" className="mt-2 text-sm text-destructive">{state.error}</p>}</form>;
}
