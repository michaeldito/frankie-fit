create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'admin');
create type public.account_type as enum ('real_user', 'internal_test', 'synthetic_demo');
create type public.message_role as enum ('user', 'assistant', 'system');
create type public.message_type as enum (
  'chat',
  'onboarding',
  'log_confirmation',
  'summary',
  'recommendation',
  'checkin_prompt',
  'system_event'
);
create type public.recommendation_type as enum ('general', 'activity', 'diet', 'wellness');
create type public.recommendation_status as enum ('active', 'completed', 'dismissed', 'expired');
create type public.summary_domain as enum ('overall', 'exercise', 'diet', 'wellness');
create type public.product_suggestion_status as enum ('proposed', 'under_review', 'approved', 'rejected');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'user',
  account_type public.account_type not null default 'real_user',
  age_range text,
  primary_goal text,
  secondary_goals text[] not null default '{}',
  activity_level text,
  fitness_experience text,
  current_activities text[] not null default '{}',
  preferred_activities text[] not null default '{}',
  available_equipment text[] not null default '{}',
  training_environment text,
  target_training_days integer check (target_training_days between 0 and 7),
  typical_session_length integer check (typical_session_length >= 0),
  preferred_schedule jsonb not null default '{}'::jsonb,
  diet_preferences text[] not null default '{}',
  diet_restrictions text[] not null default '{}',
  nutrition_goal text,
  energy_baseline text,
  stress_baseline text,
  wellness_support_focus text[] not null default '{}',
  wellness_checkin_opt_in boolean not null default true,
  injuries_limitations text[] not null default '{}',
  health_considerations text[] not null default '{}',
  avoidances text[] not null default '{}',
  coaching_style text,
  preferred_checkin_style text,
  safety_acknowledged boolean not null default false,
  onboarding_completed boolean not null default false,
  onboarding_summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.message_role not null,
  message_type public.message_type not null default 'chat',
  content text not null,
  structured_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_message_id uuid references public.conversation_messages (id) on delete set null,
  activity_type text not null,
  description text,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  intensity text,
  logged_for_date date not null default current_date,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.diet_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_message_id uuid references public.conversation_messages (id) on delete set null,
  description text not null,
  meal_type text,
  logged_for_date date not null default current_date,
  confidence numeric(3,2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_message_id uuid references public.conversation_messages (id) on delete set null,
  energy_score smallint check (energy_score is null or energy_score between 1 and 5),
  soreness_score smallint check (soreness_score is null or soreness_score between 1 and 5),
  mood_score smallint check (mood_score is null or mood_score between 1 and 5),
  stress_score smallint check (stress_score is null or stress_score between 1 and 5),
  motivation_score smallint check (motivation_score is null or motivation_score between 1 and 5),
  notes text,
  logged_for_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recommendation_type public.recommendation_type not null default 'general',
  title text not null,
  body text,
  status public.recommendation_status not null default 'active',
  generated_from_date date,
  source_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  domain public.summary_domain not null,
  summary_text text not null,
  structured_metrics_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, week_start, domain)
);

create table public.product_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggestion_type text not null,
  title text not null,
  summary text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  status public.product_suggestion_status not null default 'proposed',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz
);

create index profiles_role_idx on public.profiles (role);
create index profiles_account_type_idx on public.profiles (account_type);
create index conversation_threads_user_id_updated_at_idx on public.conversation_threads (user_id, updated_at desc);
create index conversation_messages_thread_id_created_at_idx on public.conversation_messages (thread_id, created_at);
create index conversation_messages_user_id_created_at_idx on public.conversation_messages (user_id, created_at desc);
create index activity_logs_user_id_logged_for_date_idx on public.activity_logs (user_id, logged_for_date desc);
create index diet_logs_user_id_logged_for_date_idx on public.diet_logs (user_id, logged_for_date desc);
create index wellness_checkins_user_id_logged_for_date_idx on public.wellness_checkins (user_id, logged_for_date desc);
create index recommendations_user_id_status_created_at_idx on public.recommendations (user_id, status, created_at desc);
create index weekly_summaries_user_id_week_start_domain_idx on public.weekly_summaries (user_id, week_start desc, domain);
create index product_suggestions_status_created_at_idx on public.product_suggestions (status, created_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger conversation_threads_set_updated_at
before update on public.conversation_threads
for each row
execute function public.set_updated_at();

create trigger activity_logs_set_updated_at
before update on public.activity_logs
for each row
execute function public.set_updated_at();

create trigger diet_logs_set_updated_at
before update on public.diet_logs
for each row
execute function public.set_updated_at();

create trigger wellness_checkins_set_updated_at
before update on public.wellness_checkins
for each row
execute function public.set_updated_at();

create trigger recommendations_set_updated_at
before update on public.recommendations
for each row
execute function public.set_updated_at();

create trigger product_suggestions_set_updated_at
before update on public.product_suggestions
for each row
execute function public.set_updated_at();

create or replace function public.touch_conversation_thread()
returns trigger
language plpgsql
as $$
begin
  update public.conversation_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;

  return new;
end;
$$;

create trigger conversation_messages_touch_thread
after insert on public.conversation_messages
for each row
execute function public.touch_conversation_thread();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'user'::public.app_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin'::public.app_role;
$$;

create or replace function public.is_reviewable_account(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and account_type in ('internal_test', 'synthetic_demo')
  );
$$;

alter table public.profiles enable row level security;
alter table public.conversation_threads enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.activity_logs enable row level security;
alter table public.diet_logs enable row level security;
alter table public.wellness_checkins enable row level security;
alter table public.recommendations enable row level security;
alter table public.weekly_summaries enable row level security;
alter table public.product_suggestions enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_select_reviewable_for_admins"
on public.profiles
for select
to authenticated
using (
  public.is_admin()
  and account_type in ('internal_test', 'synthetic_demo')
);

create policy "conversation_threads_select_own"
on public.conversation_threads
for select
to authenticated
using (auth.uid() = user_id);

create policy "conversation_threads_insert_own"
on public.conversation_threads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "conversation_threads_update_own"
on public.conversation_threads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "conversation_threads_delete_own"
on public.conversation_threads
for delete
to authenticated
using (auth.uid() = user_id);

create policy "conversation_threads_select_reviewable_for_admins"
on public.conversation_threads
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "conversation_messages_select_own"
on public.conversation_messages
for select
to authenticated
using (auth.uid() = user_id);

create policy "conversation_messages_insert_own"
on public.conversation_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.conversation_threads
    where id = thread_id
      and user_id = auth.uid()
  )
);

create policy "conversation_messages_select_reviewable_for_admins"
on public.conversation_messages
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "activity_logs_select_own"
on public.activity_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "activity_logs_insert_own"
on public.activity_logs
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    source_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = source_message_id
        and user_id = auth.uid()
    )
  )
);

create policy "activity_logs_update_own"
on public.activity_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    source_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = source_message_id
        and user_id = auth.uid()
    )
  )
);

create policy "activity_logs_delete_own"
on public.activity_logs
for delete
to authenticated
using (auth.uid() = user_id);

create policy "activity_logs_select_reviewable_for_admins"
on public.activity_logs
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "diet_logs_select_own"
on public.diet_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "diet_logs_insert_own"
on public.diet_logs
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    source_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = source_message_id
        and user_id = auth.uid()
    )
  )
);

create policy "diet_logs_update_own"
on public.diet_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    source_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = source_message_id
        and user_id = auth.uid()
    )
  )
);

create policy "diet_logs_delete_own"
on public.diet_logs
for delete
to authenticated
using (auth.uid() = user_id);

create policy "diet_logs_select_reviewable_for_admins"
on public.diet_logs
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "wellness_checkins_select_own"
on public.wellness_checkins
for select
to authenticated
using (auth.uid() = user_id);

create policy "wellness_checkins_insert_own"
on public.wellness_checkins
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    source_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = source_message_id
        and user_id = auth.uid()
    )
  )
);

create policy "wellness_checkins_update_own"
on public.wellness_checkins
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    source_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = source_message_id
        and user_id = auth.uid()
    )
  )
);

create policy "wellness_checkins_delete_own"
on public.wellness_checkins
for delete
to authenticated
using (auth.uid() = user_id);

create policy "wellness_checkins_select_reviewable_for_admins"
on public.wellness_checkins
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "recommendations_select_own"
on public.recommendations
for select
to authenticated
using (auth.uid() = user_id);

create policy "recommendations_insert_own"
on public.recommendations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "recommendations_update_own"
on public.recommendations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "recommendations_delete_own"
on public.recommendations
for delete
to authenticated
using (auth.uid() = user_id);

create policy "recommendations_select_reviewable_for_admins"
on public.recommendations
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "weekly_summaries_select_own"
on public.weekly_summaries
for select
to authenticated
using (auth.uid() = user_id);

create policy "weekly_summaries_insert_own"
on public.weekly_summaries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "weekly_summaries_update_own"
on public.weekly_summaries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "weekly_summaries_delete_own"
on public.weekly_summaries
for delete
to authenticated
using (auth.uid() = user_id);

create policy "weekly_summaries_select_reviewable_for_admins"
on public.weekly_summaries
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "product_suggestions_select_admins"
on public.product_suggestions
for select
to authenticated
using (public.is_admin());

create policy "product_suggestions_insert_admins"
on public.product_suggestions
for insert
to authenticated
with check (
  public.is_admin()
  and (created_by is null or created_by = auth.uid())
);

create policy "product_suggestions_update_admins"
on public.product_suggestions
for update
to authenticated
using (public.is_admin())
with check (
  public.is_admin()
  and (created_by is null or created_by = auth.uid())
);

create policy "product_suggestions_delete_admins"
on public.product_suggestions
for delete
to authenticated
using (public.is_admin());
