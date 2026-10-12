-- Run in the Supabase SQL editor after both migrations. Everything rolls back.
-- Executes real SQL as two authenticated users; any failed assertion aborts.
begin;
create temporary table food_test_users (label text, id uuid);
insert into food_test_users values ('a', gen_random_uuid()), ('b', gen_random_uuid());
grant select on food_test_users to authenticated;
insert into auth.users (id, email) select id, id::text || '@example.test' from food_test_users;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from food_test_users where label = 'b'), true);
insert into public.food_entries (user_id, entry_type, food_name, total_calories, is_total_override, meal_type, consumed_at, local_date)
values (auth.uid(), 'quick_add', 'B private entry', 10, true, 'snack', '2026-10-12T12:00:00Z', '2026-10-12');
select set_config('request.jwt.claim.sub', (select id::text from food_test_users where label = 'a'), true);

do $$
declare other_id uuid := (select id from food_test_users where label = 'b');
  affected integer;
begin
  if exists(select 1 from public.food_entries where user_id = other_id) then raise exception 'FAIL: cross-user SELECT'; end if;
  update public.food_entries set total_calories = 99 where user_id = other_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-user UPDATE'; end if;
  delete from public.food_entries where user_id = other_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-user DELETE'; end if;
  begin
    insert into public.food_entries (user_id, entry_type, food_name, total_calories, is_total_override, meal_type, consumed_at, local_date)
    values (other_id, 'quick_add', 'Spoof', 10, true, 'snack', now(), '2026-10-12');
    raise exception 'FAIL: cross-user INSERT';
  exception when insufficient_privilege then null; end;
end $$;

insert into public.food_entries (user_id, entry_type, catalog_food_id, food_name, quantity, unit, base_quantity, calories_per_base_quantity, total_calories, meal_type, consumed_at, local_date)
values (auth.uid(), 'catalog', 'khinkali', 'Snapshot name', 6, 'piece', 1, 90, 540, 'lunch', now(), '2026-10-12');
insert into public.food_entries (user_id, entry_type, food_name, quantity, unit, base_quantity, calories_per_base_quantity, total_calories, meal_type, consumed_at, local_date)
values (auth.uid(), 'custom', 'Custom drink', 250, 'ml', 100, 20, 50, 'snack', now(), '2026-10-12');

do $$
declare other_id uuid := (select id from food_test_users where label = 'b');
begin
  begin
    update public.food_entries set user_id = other_id where food_name = 'Snapshot name';
    raise exception 'FAIL: transfer ownership';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.food_entries (user_id, entry_type, food_name, total_calories, meal_type, consumed_at, local_date)
    values (auth.uid(), 'custom', 'Missing measurement', 5, 'snack', now(), '2026-10-12');
    raise exception 'FAIL: incomplete custom shape';
  exception when check_violation then null; end;
  begin
    insert into public.food_entries (user_id, entry_type, catalog_food_id, food_name, total_calories, is_total_override, meal_type, consumed_at, local_date)
    values (auth.uid(), 'quick_add', 'egg', 'Invalid Quick Add', 5, true, 'snack', now(), '2026-10-12');
    raise exception 'FAIL: Quick Add with catalog ID';
  exception when check_violation then null; end;
  begin
    update public.food_entries set total_calories = -1 where food_name = 'Snapshot name';
    raise exception 'FAIL: negative total';
  exception when check_violation then null; end;
  begin
    update public.food_entries set total_calories = 'NaN'::numeric where food_name = 'Snapshot name';
    raise exception 'FAIL: NaN total';
  exception when check_violation then null; end;
  update public.food_entries set total_calories = 123.456, is_total_override = true where food_name = 'Snapshot name';
  if not exists(select 1 from public.food_entries where food_name = 'Snapshot name' and total_calories = 123.456 and calories_per_base_quantity = 90 and is_total_override) then raise exception 'FAIL: snapshot/override persistence'; end if;
  delete from public.food_entries where food_name = 'Custom drink';
  if exists(select 1 from public.food_entries where food_name = 'Custom drink') then raise exception 'FAIL: owned delete'; end if;
end $$;

select set_config('request.jwt.claim.sub', (select id::text from food_test_users where label = 'b'), true);
do $$ begin
  if not exists(select 1 from public.food_entries where food_name = 'B private entry' and total_calories = 10) then raise exception 'FAIL: B entry changed'; end if;
  if exists(select 1 from public.food_entries where food_name = 'Snapshot name') then raise exception 'FAIL: reverse isolation'; end if;
end $$;
reset role;
rollback;
