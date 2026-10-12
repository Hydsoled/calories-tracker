"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { searchCatalog } from "@/lib/nutrition/catalog-search";
import { FoodEditorButton } from "./food-editor-button";
export function FoodSearch({ defaultTime, timezone }: { defaultTime: string; timezone: string }) {
  const [query, setQuery] = useState("");
  const foods = searchCatalog(query);
  return <section className="space-y-4" aria-labelledby="catalog-title"><h2 id="catalog-title" className="text-lg font-semibold">Find a food</h2><label htmlFor="food-search" className="sr-only">Search foods in English or Georgian</label><Input id="food-search" type="search" placeholder="Search in English or Georgian" value={query} onChange={(e) => setQuery(e.target.value)} />
    <div className="flex flex-wrap gap-2"><FoodEditorButton mode="quick_add" defaultTime={defaultTime} timezone={timezone}>Quick Add</FoodEditorButton><FoodEditorButton mode="custom" defaultTime={defaultTime} timezone={timezone}>Custom food</FoodEditorButton></div>
    {foods.length ? <ul className="grid gap-3 sm:grid-cols-2">{foods.map((food) => <li key={food.id} className="[&_button]:w-full [&_button]:justify-start"><FoodEditorButton mode="catalog" food={food} defaultTime={defaultTime} timezone={timezone}><span className="min-w-0 whitespace-normal"><span className="block">{food.name}</span><span lang="ka" className="block text-sm font-normal text-muted-foreground">{food.nameKa}</span><span className="mt-1 block text-sm font-normal">Estimated {food.caloriesPerBaseQuantity} kcal / {food.baseQuantity} {food.unit}</span></span></FoodEditorButton></li>)}</ul> : <p role="status" className="text-sm text-muted-foreground">No matches. Try another name or add a custom food.</p>}
    <p className="text-xs text-muted-foreground">Calories are estimates and may vary by recipe or portion.</p>
  </section>;
}
