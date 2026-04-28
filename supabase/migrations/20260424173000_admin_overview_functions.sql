create or replace function public.admin_overview_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  last_7_days timestamptz := timezone('utc', now()) - interval '7 days';
  last_30_days timestamptz := timezone('utc', now()) - interval '30 days';
  total_real_users integer;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  select count(*)
  into total_real_users
  from public.profiles
  where account_type = 'real_user';

  return jsonb_build_object(
    'totalUsers', (select count(*) from public.profiles),
    'realUsers', total_real_users,
    'internalTestUsers', (select count(*) from public.profiles where account_type = 'internal_test'),
    'syntheticDemoUsers', (select count(*) from public.profiles where account_type = 'synthetic_demo'),
    'onboardingCompleted', (
      select count(*)
      from public.profiles
      where account_type = 'real_user'
        and onboarding_completed
    ),
    'onboardingCompletionRate', (
      case
        when total_real_users = 0 then 0
        else round(
          (
            (
              select count(*)
              from public.profiles
              where account_type = 'real_user'
                and onboarding_completed
            )::numeric / total_real_users::numeric
          ) * 100,
          1
        )
      end
    ),
    'activeUsers7d', (
      with activity as (
        select user_id
        from public.conversation_messages
        where role = 'user'
          and created_at >= last_7_days
        union
        select user_id
        from public.activity_logs
        where created_at >= last_7_days
        union
        select user_id
        from public.diet_logs
        where created_at >= last_7_days
        union
        select user_id
        from public.wellness_checkins
        where created_at >= last_7_days
      )
      select count(*)
      from (
        select distinct activity.user_id
        from activity
        join public.profiles on profiles.id = activity.user_id
        where profiles.account_type = 'real_user'
      ) distinct_users
    ),
    'activeUsers30d', (
      with activity as (
        select user_id
        from public.conversation_messages
        where role = 'user'
          and created_at >= last_30_days
        union
        select user_id
        from public.activity_logs
        where created_at >= last_30_days
        union
        select user_id
        from public.diet_logs
        where created_at >= last_30_days
        union
        select user_id
        from public.wellness_checkins
        where created_at >= last_30_days
      )
      select count(*)
      from (
        select distinct activity.user_id
        from activity
        join public.profiles on profiles.id = activity.user_id
        where profiles.account_type = 'real_user'
      ) distinct_users
    ),
    'conversationVolume7d', (
      select count(*)
      from public.conversation_messages
      join public.profiles on profiles.id = conversation_messages.user_id
      where conversation_messages.role = 'user'
        and conversation_messages.created_at >= last_7_days
        and profiles.account_type = 'real_user'
    ),
    'pillarUsage30d', jsonb_build_object(
      'activity', (
        select count(*)
        from public.activity_logs
        join public.profiles on profiles.id = activity_logs.user_id
        where activity_logs.created_at >= last_30_days
          and profiles.account_type = 'real_user'
      ),
      'diet', (
        select count(*)
        from public.diet_logs
        join public.profiles on profiles.id = diet_logs.user_id
        where diet_logs.created_at >= last_30_days
          and profiles.account_type = 'real_user'
      ),
      'wellness', (
        select count(*)
        from public.wellness_checkins
        join public.profiles on profiles.id = wellness_checkins.user_id
        where wellness_checkins.created_at >= last_30_days
          and profiles.account_type = 'real_user'
      )
    )
  );
end;
$$;

grant execute on function public.admin_overview_metrics() to authenticated;

create or replace function public.admin_prompt_theme_counts()
returns table(theme text, entry_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  return query
  with recent_messages as (
    select lower(conversation_messages.content) as content
    from public.conversation_messages
    join public.profiles on profiles.id = conversation_messages.user_id
    where conversation_messages.role = 'user'
      and conversation_messages.created_at >= timezone('utc', now()) - interval '30 days'
      and profiles.account_type = 'real_user'
  ),
  themed as (
    select
      case
        when content like '%what should%' or content like '%plan%' or content like '%routine%' then 'Planning'
        when content like '%breakfast%' or content like '%lunch%' or content like '%dinner%' or content like '%ate%' or content like '%had %' then 'Food logging'
        when content like '%energy%' or content like '%stress%' or content like '%sore%' or content like '%motivation%' or content like '%mood%' then 'Wellness check-ins'
        when content like '%run%' or content like '%walk%' or content like '%lift%' or content like '%bike%' or content like '%workout%' then 'Activity logging'
        else 'General coaching'
      end as theme
    from recent_messages
  )
  select themed.theme, count(*) as entry_count
  from themed
  group by themed.theme
  order by count(*) desc, themed.theme asc
  limit 5;
end;
$$;

grant execute on function public.admin_prompt_theme_counts() to authenticated;

create or replace function public.admin_friction_summary()
returns table(label text, entry_count bigint, detail text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  return query
  with real_users as (
    select id, onboarding_completed
    from public.profiles
    where account_type = 'real_user'
  ),
  last_7_day_diet as (
    select distinct diet_logs.user_id
    from public.diet_logs
    where diet_logs.created_at >= timezone('utc', now()) - interval '7 days'
  ),
  last_7_day_wellness as (
    select distinct wellness_checkins.user_id
    from public.wellness_checkins
    where wellness_checkins.created_at >= timezone('utc', now()) - interval '7 days'
  ),
  last_30_day_pillar_usage as (
    select
      profiles.id as user_id,
      (
        case when exists (
          select 1
          from public.activity_logs
          where activity_logs.user_id = profiles.id
            and activity_logs.created_at >= timezone('utc', now()) - interval '30 days'
        ) then 1 else 0 end
      ) +
      (
        case when exists (
          select 1
          from public.diet_logs
          where diet_logs.user_id = profiles.id
            and diet_logs.created_at >= timezone('utc', now()) - interval '30 days'
        ) then 1 else 0 end
      ) +
      (
        case when exists (
          select 1
          from public.wellness_checkins
          where wellness_checkins.user_id = profiles.id
            and wellness_checkins.created_at >= timezone('utc', now()) - interval '30 days'
        ) then 1 else 0 end
      ) as pillar_count
    from public.profiles
    where profiles.account_type = 'real_user'
  )
  select 'Onboarding incomplete'::text, count(*)::bigint, 'Real users who have not finished onboarding yet.'::text
  from real_users
  where not onboarding_completed

  union all

  select 'No diet logs in 7 days'::text, count(*)::bigint, 'Real users without a recent food update.'::text
  from real_users
  where onboarding_completed
    and id not in (select user_id from last_7_day_diet)

  union all

  select 'No wellness check-in in 7 days'::text, count(*)::bigint, 'Real users without a recent energy or recovery check-in.'::text
  from real_users
  where onboarding_completed
    and id not in (select user_id from last_7_day_wellness)

  union all

  select 'Single-pillar usage only'::text, count(*)::bigint, 'Real users who only used one of the three pillars in the last 30 days.'::text
  from last_30_day_pillar_usage
  where pillar_count = 1;
end;
$$;

grant execute on function public.admin_friction_summary() to authenticated;
