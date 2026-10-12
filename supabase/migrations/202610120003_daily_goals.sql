begin;
create table public.daily_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  effective_date date not null check (isfinite(effective_date)),
  calorie_goal integer not null check (calorie_goal > 0),
  created_at timestamptz not null default now(),
  unique (user_id, effective_date)
);
alter table public.daily_goals enable row level security;
revoke all on public.daily_goals from anon;
grant select, insert, update, delete on public.daily_goals to authenticated;
create policy daily_goals_select on public.daily_goals for select to authenticated using (user_id = (select auth.uid()));
create policy daily_goals_insert on public.daily_goals for insert to authenticated with check (user_id = (select auth.uid()));
create policy daily_goals_update on public.daily_goals for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy daily_goals_delete on public.daily_goals for delete to authenticated using (user_id = (select auth.uid()));

-- Aggregate all entries independently of the paginated visible list. RLS remains active.
create function public.daily_food_total(selected_date date) returns numeric
language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(total_calories), 0) from public.food_entries
  where user_id = (select auth.uid()) and local_date = selected_date;
$$;
revoke all on function public.daily_food_total(date) from public, anon;
grant execute on function public.daily_food_total(date) to authenticated;
commit;
