"use client";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { FoodLogDialog } from "./food-log-dialog";
import type { FoodEntryRow } from "@/lib/data/food-entry-model";
import type { BuiltInFood } from "@/types/food";
export function FoodEditorButton({ mode, food, original, defaultTime, timezone, children }: {
  mode: "catalog" | "custom" | "quick_add";
  food?: BuiltInFood;
  original?: FoodEntryRow;
  defaultTime: string;
  timezone: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const close = useCallback((success?: string) => { setOpen(false); if (success) setMessage(success); }, []);
  return <><Button variant="outline" className="h-auto text-left" onClick={() => { setMessage(""); setOpen(true); }}>{children}</Button>{message && <p role="status" className="mt-2 text-sm">{message}</p>}{open && <FoodLogDialog mode={mode} food={food} original={original} defaultTime={defaultTime} timezone={timezone} onClose={close} />}</>;
}
