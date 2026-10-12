import { BUILT_IN_FOODS } from "../constants/foods.ts";
import type { BuiltInFood } from "../../types/food.ts";

export function searchCatalog(query: string): readonly BuiltInFood[] {
  const term = query.trim().normalize("NFC").toLowerCase();
  return BUILT_IN_FOODS.filter((food) =>
    [food.name, food.nameKa].some((name) => name.normalize("NFC").toLowerCase().includes(term)),
  );
}
