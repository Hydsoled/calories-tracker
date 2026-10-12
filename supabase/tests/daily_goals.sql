-- Run after migration 003 in SQL Editor. All test users/data roll back.
begin;
create temporary table goal_test_users (label text, id uuid);
insert into goal_test_users values ('a', gen_random_uuid()), ('b', gen_random_uuid());
grant select on goal_test_users to authenticated;
insert into auth.users (id, email) select id, id::text || '@example.test' from goal_test_users;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from goal_test_users where label = 'b'), true);
insert into public.daily_goals (user_id, effective_date, calorie_goal) values (auth.uid(), '2026-10-01', 1500);
insert into public.food_entries (user_id, entry_type, food_name, total_calories, is_total_override, meal_type, consumed_at, local_date)
values (auth.uid(), 'quick_add', 'B private', 999, true, 'snack', now(), '2026-10-12');
select set_config('request.jwt.claim.sub', (select id::text from goal_test_users where label = 'a'), true);
insert into public.daily_goals (user_id, effective_date, calorie_goal) values (auth.uid(), '2026-10-01', 1800), (auth.uid(), '2026-10-12', 1900);
insert into public.daily_goals (user_id, effective_date, calorie_goal) values (auth.uid(), '2026-10-12', 2100)
on conflict (user_id, effective_date) do update set calorie_goal = excluded.calorie_goal;
-- 25 entries ensures totals are independent of the 20-entry UI page.
insert into public.food_entries (user_id, entry_type, food_name, total_calories, is_total_override, meal_type, consumed_at, local_date)
select auth.uid(), 'quick_add', 'A test ' || n, 100.001, true, 'snack', now(), '2026-10-12' from generate_series(1,25) n;
do $$
declare other_id uuid := (select id from goal_test_users where label = 'b'); affected integer;
begin
  if exists(select 1 from public.daily_goals where user_id = other_id) then raise exception 'FAIL: goal SELECT isolation'; end if;
  update public.daily_goals set calorie_goal = 999 where user_id = other_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: goal UPDATE isolation'; end if;
  delete from public.daily_goals where user_id = other_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: goal DELETE isolation'; end if;
  begin
    insert into public.daily_goals (user_id,effective_date,calorie_goal) values (other_id,'2026-10-13',2000);
    raise exception 'FAIL: goal INSERT isolation';
  exception when insufficient_privilege then null; end;
  begin
    update public.daily_goals set user_id = other_id where effective_date = '2026-10-12';
    raise exception 'FAIL: goal ownership transfer';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.daily_goals (user_id,effective_date,calorie_goal) values (auth.uid(),'2026-10-13',0);
    raise exception 'FAIL: nonpositive goal';
  exception when check_violation then null; end;
  if (select calorie_goal from public.daily_goals where effective_date <= '2026-10-11' order by effective_date desc limit 1) <> 1800 then raise exception 'FAIL: historical goal'; end if;
  if (select calorie_goal from public.daily_goals where effective_date <= '2026-10-12' order by effective_date desc limit 1) <> 2100 then raise exception 'FAIL: same-date goal upsert'; end if;
  if (select count(*) from public.daily_goals) <> 2 then raise exception 'FAIL: duplicate effective date'; end if;
  if public.daily_food_total('2026-10-12') <> 2500.025 then raise exception 'FAIL: complete total/isolation'; end if;
  if public.daily_food_total('2026-10-11') <> 0 then raise exception 'FAIL: empty total'; end if;
  update public.food_entries set total_calories = 50 where food_name = 'A test 1';
  if public.daily_food_total('2026-10-12') <> 2450.024 then raise exception 'FAIL: total after edit'; end if;
  delete from public.food_entries where food_name = 'A test 1';
  if public.daily_food_total('2026-10-12') <> 2400.024 then raise exception 'FAIL: total after delete'; end if;
end $$;
select set_config('request.jwt.claim.sub', (select id::text from goal_test_users where label = 'b'), true);
do $$ begin
  if public.daily_food_total('2026-10-12') <> 999 then raise exception 'FAIL: reverse total isolation'; end if;
  if (select calorie_goal from public.daily_goals where effective_date = '2026-10-01') <> 1500 then raise exception 'FAIL: B goal changed'; end if;
end $$;
reset role;
rollback;
