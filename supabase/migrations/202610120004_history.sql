begin;
create function public.monthly_food_totals(month_start date, month_end date)
returns table(local_date date, total_calories numeric, entry_count bigint)
language sql stable security invoker set search_path = '' as $$
  select local_date, sum(total_calories), count(*) from public.food_entries
  where user_id = (select auth.uid()) and local_date between month_start and month_end
  group by local_date order by local_date;
$$;
create function public.logged_food_dates(before_date date default null)
returns table(local_date date)
language sql stable security invoker set search_path = '' as $$
  select distinct local_date from public.food_entries
  where user_id = (select auth.uid()) and (before_date is null or local_date < before_date)
  order by local_date desc;
$$;
revoke all on function public.monthly_food_totals(date,date) from public, anon;
revoke all on function public.logged_food_dates(date) from public, anon;
grant execute on function public.monthly_food_totals(date,date) to authenticated;
grant execute on function public.logged_food_dates(date) to authenticated;
commit;
