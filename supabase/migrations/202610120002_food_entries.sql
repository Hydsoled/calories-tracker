begin;
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('catalog','custom','quick_add')),
  catalog_food_id text,
  food_name text not null check (length(trim(food_name)) between 1 and 200),
  quantity numeric(12,3) check (quantity > 0 and quantity <> 'NaN'::numeric),
  unit text check (unit in ('g','ml','piece','serving')),
  base_quantity numeric(12,3) check (base_quantity > 0 and base_quantity <> 'NaN'::numeric),
  calories_per_base_quantity numeric(12,3) check (calories_per_base_quantity >= 0 and calories_per_base_quantity <> 'NaN'::numeric),
  total_calories numeric(12,3) not null check (total_calories >= 0 and total_calories <> 'NaN'::numeric),
  is_total_override boolean not null default false,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  consumed_at timestamptz not null check (isfinite(consumed_at)),
  local_date date not null check (isfinite(local_date)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_entry_shape check (
    (entry_type = 'quick_add' and catalog_food_id is null and quantity is null and unit is null and base_quantity is null and calories_per_base_quantity is null and is_total_override)
    or
    (entry_type in ('catalog','custom') and quantity is not null and unit is not null and base_quantity is not null and calories_per_base_quantity is not null
      and ((entry_type = 'catalog' and catalog_food_id is not null and length(trim(catalog_food_id)) > 0) or (entry_type = 'custom' and catalog_food_id is null)))
  )
);
create index food_entries_user_local_date on public.food_entries (user_id, local_date, consumed_at desc);
alter table public.food_entries enable row level security;
revoke all on public.food_entries from anon;
grant select, insert, update, delete on public.food_entries to authenticated;
create policy food_entries_select on public.food_entries for select to authenticated using (user_id = (select auth.uid()));
create policy food_entries_insert on public.food_entries for insert to authenticated with check (user_id = (select auth.uid()));
create policy food_entries_update on public.food_entries for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy food_entries_delete on public.food_entries for delete to authenticated using (user_id = (select auth.uid()));
create trigger food_entries_updated_at before update on public.food_entries for each row execute function public.update_profile_timestamp();
commit;
