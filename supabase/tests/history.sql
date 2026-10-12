-- Run after all four migrations in SQL Editor. All test data rolls back.
begin;
create temporary table history_test_users (label text, id uuid);
insert into history_test_users values ('a', gen_random_uuid()), ('b', gen_random_uuid());
grant select on history_test_users to authenticated;
insert into auth.users (id,email) select id,id::text || '@example.test' from history_test_users;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from history_test_users where label = 'b'), true);
insert into public.food_entries (user_id,entry_type,food_name,total_calories,is_total_override,meal_type,consumed_at,local_date)
values (auth.uid(),'quick_add','B private',999,true,'snack','2026-10-12T21:00:00Z','2026-10-12');
select set_config('request.jwt.claim.sub', (select id::text from history_test_users where label = 'a'), true);
insert into public.food_entries (user_id,entry_type,food_name,total_calories,is_total_override,meal_type,consumed_at,local_date)
values (auth.uid(),'quick_add','First',10,true,'snack','2026-10-11T12:00:00Z','2026-10-11'),
(auth.uid(),'quick_add','Second',20,true,'snack','2026-10-12T21:00:00Z','2026-10-12'),
(auth.uid(),'quick_add','Third',30,true,'snack','2026-10-12T22:00:00Z','2026-10-12');
do $$ declare other_id uuid := (select id from history_test_users where label = 'b'); affected integer;
begin
  if (select count(*) from public.logged_food_dates()) <> 2 then raise exception 'FAIL: distinct dates/isolation'; end if;
  if (select count(*) from public.logged_food_dates('2026-10-12')) <> 1 then raise exception 'FAIL: date pagination'; end if;
  if not exists(select 1 from public.monthly_food_totals('2026-10-01','2026-10-31') where local_date='2026-10-12' and total_calories=50 and entry_count=2) then raise exception 'FAIL: month aggregation/isolation'; end if;
  update public.profiles set timezone='Asia/Tbilisi', display_name='Test reader' where id=auth.uid();
  if not exists(select 1 from public.food_entries where food_name='Second' and local_date='2026-10-12') then raise exception 'FAIL: timezone rewrote history'; end if;
  update public.profiles set timezone='UTC' where id=other_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-user profile UPDATE'; end if;
  if exists(select 1 from public.profiles where id=other_id) then raise exception 'FAIL: cross-user profile SELECT'; end if;
  -- An explicit server edit recomputes local_date for the new profile timezone.
  update public.food_entries set local_date=(consumed_at at time zone 'Asia/Tbilisi')::date where food_name='Second';
  if not exists(select 1 from public.food_entries where food_name='Second' and local_date='2026-10-13') then raise exception 'FAIL: edited date'; end if;
  delete from public.food_entries where food_name='Third';
  if exists(select 1 from public.logged_food_dates() where local_date='2026-10-12') then raise exception 'FAIL: deleted last entry still logs day'; end if;
end $$;
select set_config('request.jwt.claim.sub', (select id::text from history_test_users where label='b'), true);
do $$ begin
  if (select count(*) from public.logged_food_dates()) <> 1 then raise exception 'FAIL: reverse date isolation'; end if;
  if not exists(select 1 from public.monthly_food_totals('2026-10-01','2026-10-31') where total_calories=999) then raise exception 'FAIL: reverse totals'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and timezone='UTC') then raise exception 'FAIL: B timezone changed'; end if;
end $$;
reset role;
rollback;
