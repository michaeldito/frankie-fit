-- Every log earns a biscuit (was: the first log per pillar per day). The full-bowl bonus for logging
-- all four pillars in a day stays. Earn numbers mirror packages/companion-core/rules.ts.

alter table public.biscuit_ledger
add column source_table text check (
  source_table in ('activity_logs', 'diet_logs', 'wellness_checkins', 'lifestyle_logs')
),
add column source_id uuid;

-- Attach each existing per-pillar reward to the first log of that pillar on its day, so the new
-- per-log rule doesn't pay those logs a second time.
update public.biscuit_ledger as b
set source_table = 'activity_logs',
    source_id = (
      select a.id from public.activity_logs a
      where a.user_id = b.user_id and a.logged_for_date = b.date_key
      order by a.created_at limit 1
    )
where b.reason = 'log_reward' and b.pillar = 'exercise';

update public.biscuit_ledger as b
set source_table = 'diet_logs',
    source_id = (
      select d.id from public.diet_logs d
      where d.user_id = b.user_id and d.logged_for_date = b.date_key
      order by d.created_at limit 1
    )
where b.reason = 'log_reward' and b.pillar = 'diet';

update public.biscuit_ledger as b
set source_table = 'wellness_checkins',
    source_id = (
      select w.id from public.wellness_checkins w
      where w.user_id = b.user_id and w.logged_for_date = b.date_key
      order by w.created_at limit 1
    )
where b.reason = 'log_reward' and b.pillar = 'wellness';

update public.biscuit_ledger as b
set source_table = 'lifestyle_logs',
    source_id = (
      select l.id from public.lifestyle_logs l
      where l.user_id = b.user_id and l.logged_for_date = b.date_key
      order by l.created_at limit 1
    )
where b.reason = 'log_reward' and b.pillar = 'lifestyle';

drop index public.biscuit_ledger_log_reward_once_idx;

-- One biscuit per log, so award_biscuits stays safe to call repeatedly.
create unique index biscuit_ledger_log_reward_source_idx
on public.biscuit_ledger (user_id, source_table, source_id)
where reason = 'log_reward';

create or replace function public.award_biscuits(p_date_key date)
returns setof public.biscuit_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := public.frankie_pacific_today();
  v_pillar_count integer;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Only recent days can earn, so back- or forward-dated logs can't farm biscuits.
  if p_date_key is null or p_date_key > v_today or p_date_key < v_today - 7 then
    return;
  end if;

  return query
  with day_logs as (
    select 'activity_logs' as source_table, id as source_id, 'exercise' as pillar
    from public.activity_logs where user_id = v_user and logged_for_date = p_date_key
    union all
    select 'diet_logs', id, 'diet' from public.diet_logs where user_id = v_user and logged_for_date = p_date_key
    union all
    select 'wellness_checkins', id, 'wellness'
    from public.wellness_checkins where user_id = v_user and logged_for_date = p_date_key
    union all
    select 'lifestyle_logs', id, 'lifestyle' from public.lifestyle_logs where user_id = v_user and logged_for_date = p_date_key
  ),
  inserted as (
    insert into public.biscuit_ledger (user_id, delta, reason, pillar, date_key, source_table, source_id)
    select v_user, 1, 'log_reward', day_logs.pillar, p_date_key, day_logs.source_table, day_logs.source_id
    from day_logs
    on conflict do nothing
    returning *
  )
  select * from inserted;

  select
    (exists (select 1 from public.activity_logs where user_id = v_user and logged_for_date = p_date_key))::int
    + (exists (select 1 from public.diet_logs where user_id = v_user and logged_for_date = p_date_key))::int
    + (exists (select 1 from public.wellness_checkins where user_id = v_user and logged_for_date = p_date_key))::int
    + (exists (select 1 from public.lifestyle_logs where user_id = v_user and logged_for_date = p_date_key))::int
  into v_pillar_count;

  if v_pillar_count = 4 then
    return query
    with inserted as (
      insert into public.biscuit_ledger (user_id, delta, reason, date_key)
      values (v_user, 1, 'full_bowl_bonus', p_date_key)
      on conflict do nothing
      returning *
    )
    select * from inserted;
  end if;
end;
$$;
