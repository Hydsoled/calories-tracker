import { calorieCalculationSchema, nutritionNumberSchema } from "../validations/nutrition.ts";
import type { z } from "zod";

export type CalorieCalculationInput = z.input<typeof calorieCalculationSchema>;
const SCALE = BigInt(1000);
const MAX_SCALED = BigInt("999999999999");

function toThousandths(value: number): bigint {
  const [whole, fraction = ""] = String(value).split(".");
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(3, "0"));
}

/** Round once, half up to 0.001 kcal; integer arithmetic avoids float products. */
export function calculateCalories(input: CalorieCalculationInput): number {
  const values = calorieCalculationSchema.parse(input);
  if (values.totalOverride !== undefined) return values.totalOverride;
  const numerator = toThousandths(values.quantity) * toThousandths(values.caloriesPerBaseQuantity);
  const denominator = toThousandths(values.baseQuantity);
  const total = (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));
  if (total > MAX_SCALED) throw new RangeError("Total calories exceed the supported database range.");
  return Number(total) / 1000;
}

/** Display rounding never changes the persisted total. */
export function roundCaloriesForDisplay(value: number): number {
  return Math.round(nutritionNumberSchema.parse(value));
}
