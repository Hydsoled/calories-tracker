import type { FoodEntryRow } from "../lib/data/food-entry-model";

// Derived from the checked-in migrations. Regenerate against the live schema before release.
type ProfileRow = { id: string; display_name: string | null; timezone: string; created_at: string; updated_at: string };
type GoalRow = { id: string; user_id: string; effective_date: string; calorie_goal: number; created_at: string };
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: { id: string; display_name?: string | null; timezone?: string; created_at?: string; updated_at?: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      daily_goals: {
        Row: GoalRow;
        Insert: { id?: string; user_id: string; effective_date: string; calorie_goal: number; created_at?: string };
        Update: Partial<GoalRow>;
        Relationships: [];
      };
      food_entries: {
        Row: FoodEntryRow;
        Insert: Omit<FoodEntryRow, "id" | "created_at" | "updated_at" | "is_total_override"> & {
          id?: string; created_at?: string; updated_at?: string; is_total_override?: boolean;
        };
        Update: Partial<FoodEntryRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      daily_food_total: { Args: { selected_date: string }; Returns: number };
      monthly_food_totals: { Args: { month_start: string; month_end: string }; Returns: { local_date: string; total_calories: number; entry_count: number }[] };
      logged_food_dates: { Args: { before_date?: string | null }; Returns: { local_date: string }[] };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
