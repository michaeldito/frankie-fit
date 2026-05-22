create table public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  suite_id text not null default 'frankie-benchmark-v1',
  scenario_id text,
  run_scope text not null default 'scenario' check (run_scope in ('scenario', 'suite')),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  model_name text,
  prompt_version text,
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.eval_run_items (
  id uuid primary key default gen_random_uuid(),
  eval_run_id uuid not null references public.eval_runs (id) on delete cascade,
  scenario_id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  day_index integer,
  pillar text not null check (pillar in ('activity', 'diet', 'wellness', 'summary')),
  input_message text not null,
  expected_json jsonb not null default '{}'::jsonb,
  trace_id uuid references public.ai_trace_runs (id) on delete set null,
  source_message_id uuid references public.conversation_messages (id) on delete set null,
  assistant_message_id uuid references public.conversation_messages (id) on delete set null,
  assistant_reply text,
  actual_json jsonb not null default '{}'::jsonb,
  run_status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.eval_reviews (
  id uuid primary key default gen_random_uuid(),
  eval_run_item_id uuid not null references public.eval_run_items (id) on delete cascade,
  review_check text not null,
  status text not null check (status in ('good', 'needs_work', 'not_applicable')),
  issue_tags text[] not null default '{}',
  field_note text,
  expected_behavior text,
  actual_behavior text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (eval_run_item_id, review_check)
);

create table public.coach_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  summary_type text not null check (summary_type in ('daily', 'weekly')),
  period_start date not null,
  period_end date not null,
  summary_text text not null,
  structured_metrics_json jsonb not null default '{}'::jsonb,
  model_name text,
  prompt_version text,
  source_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, summary_type, period_start, period_end)
);

create index eval_runs_created_at_idx on public.eval_runs (created_at desc);
create index eval_runs_scenario_id_created_at_idx on public.eval_runs (scenario_id, created_at desc);
create index eval_run_items_eval_run_id_created_at_idx on public.eval_run_items (eval_run_id, created_at);
create index eval_run_items_user_id_created_at_idx on public.eval_run_items (user_id, created_at desc);
create index eval_reviews_eval_run_item_id_idx on public.eval_reviews (eval_run_item_id);
create index coach_summaries_user_id_period_idx on public.coach_summaries (user_id, summary_type, period_start desc);

create trigger eval_reviews_set_updated_at
before update on public.eval_reviews
for each row
execute function public.set_updated_at();

create trigger coach_summaries_set_updated_at
before update on public.coach_summaries
for each row
execute function public.set_updated_at();

alter table public.eval_runs enable row level security;
alter table public.eval_run_items enable row level security;
alter table public.eval_reviews enable row level security;
alter table public.coach_summaries enable row level security;

create policy "eval_runs_select_admins"
on public.eval_runs
for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "eval_runs_insert_admins"
on public.eval_runs
for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "eval_runs_update_admins"
on public.eval_runs
for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "eval_run_items_select_admins"
on public.eval_run_items
for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "eval_run_items_insert_admins"
on public.eval_run_items
for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "eval_reviews_select_admins"
on public.eval_reviews
for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "eval_reviews_insert_admins"
on public.eval_reviews
for insert
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "eval_reviews_update_admins"
on public.eval_reviews
for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "coach_summaries_select_own"
on public.coach_summaries
for select
using (auth.uid() = user_id);

create policy "coach_summaries_select_admins"
on public.coach_summaries
for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "coach_summaries_insert_own"
on public.coach_summaries
for insert
with check (auth.uid() = user_id);

create policy "coach_summaries_update_own"
on public.coach_summaries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "coach_summaries_delete_own"
on public.coach_summaries
for delete
using (auth.uid() = user_id);
