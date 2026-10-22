-- Frankie's Day: logging earns biscuits, biscuits are redeemed to care for Frankie.
-- Earn/cost numbers mirror packages/companion-core/rules.ts (a test asserts they match).

create table public.biscuit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (
    reason in ('log_reward', 'full_bowl_bonus', 'care_feed', 'care_walk', 'care_play', 'care_snuggle')
  ),
  pillar text check (pillar in ('exercise', 'diet', 'wellness', 'lifestyle')),
  date_key date not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint biscuit_ledger_pillar_only_for_log_rewards check ((reason = 'log_reward') = (pillar is not null))
);

-- One log reward per pillar per day, and every other reason at most once per day. These make
-- award_biscuits idempotent and stop a need from being filled twice.
create unique index biscuit_ledger_log_reward_once_idx
on public.biscuit_ledger (user_id, pillar, date_key)
where reason = 'log_reward';

create unique index biscuit_ledger_daily_once_idx
on public.biscuit_ledger (user_id, reason, date_key)
where reason <> 'log_reward';

create index biscuit_ledger_user_id_date_key_idx on public.biscuit_ledger (user_id, date_key desc);

alter table public.biscuit_ledger enable row level security;

-- Read-only to clients: every write goes through the two functions below, so biscuits can't be
-- minted by inserting rows directly.
create policy "biscuit_ledger_select_own"
on public.biscuit_ledger
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.frankie_pacific_today()
returns date
language sql
stable
as $$
  select (timezone('America/Los_Angeles', now()))::date;
$$;

create or replace function public.award_biscuits(p_date_key date)
returns setof public.biscuit_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := public.frankie_pacific_today();
  v_pillars text[];
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Only recent days can earn, so back- or forward-dated logs can't farm biscuits.
  if p_date_key is null or p_date_key > v_today or p_date_key < v_today - 7 then
    return;
  end if;

  select coalesce(array_agg(logged.pillar), '{}') into v_pillars
  from (
    select 'exercise' as pillar
    where exists (select 1 from public.activity_logs where user_id = v_user and logged_for_date = p_date_key)
    union all
    select 'diet'
    where exists (select 1 from public.diet_logs where user_id = v_user and logged_for_date = p_date_key)
    union all
    select 'wellness'
    where exists (select 1 from public.wellness_checkins where user_id = v_user and logged_for_date = p_date_key)
    union all
    select 'lifestyle'
    where exists (select 1 from public.lifestyle_logs where user_id = v_user and logged_for_date = p_date_key)
  ) logged;

  return query
  with inserted as (
    insert into public.biscuit_ledger (user_id, delta, reason, pillar, date_key)
    select v_user, 1, 'log_reward', logged_pillar, p_date_key
    from unnest(v_pillars) as logged_pillar
    on conflict do nothing
    returning *
  )
  select * from inserted;

  if cardinality(v_pillars) = 4 then
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

create or replace function public.redeem_frankie_action(p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := public.frankie_pacific_today();
  v_cost constant integer := 1;
  v_reason text := 'care_' || p_kind;
  v_balance integer;
begin
  if v_user is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_kind is null or p_kind not in ('feed', 'walk', 'play', 'snuggle') then
    return jsonb_build_object('ok', false, 'error', 'unknown_action');
  end if;

  -- Serialize spends per user so a double tap can't spend the same biscuit twice.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  select coalesce(sum(delta), 0) into v_balance from public.biscuit_ledger where user_id = v_user;

  if exists (
    select 1 from public.biscuit_ledger where user_id = v_user and reason = v_reason and date_key = v_today
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_filled', 'balance', v_balance);
  end if;

  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'error', 'not_enough_biscuits', 'balance', v_balance);
  end if;

  insert into public.biscuit_ledger (user_id, delta, reason, date_key)
  values (v_user, -v_cost, v_reason, v_today);

  return jsonb_build_object('ok', true, 'balance', v_balance - v_cost);
end;
$$;

revoke all on function public.award_biscuits(date) from public, anon;
revoke all on function public.redeem_frankie_action(text) from public, anon;
grant execute on function public.award_biscuits(date) to authenticated;
grant execute on function public.redeem_frankie_action(text) to authenticated;

alter table public.profiles
add column frankie_nudge_level text not null default 'polite'
check (frankie_nudge_level in ('off', 'polite', 'whiny'));

alter table public.notifications drop constraint notifications_type_check;

alter table public.notifications add constraint notifications_type_check
  check (type in ('checkin_reminder', 'daily_summary', 'weekly_summary', 'frankie_nudge'));
