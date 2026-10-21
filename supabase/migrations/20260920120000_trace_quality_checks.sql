create table public.ai_trace_quality_checks (
  id            uuid primary key default gen_random_uuid(),
  trace_run_id  uuid not null references public.ai_trace_runs(id) on delete cascade,
  check_name    text not null,
  check_result  text not null check (check_result in ('pass', 'warn', 'fail')),
  detail        text,
  created_at    timestamptz not null default timezone('utc', now())
);

create index idx_trace_quality_checks_trace
on public.ai_trace_quality_checks (trace_run_id);

create index idx_trace_quality_checks_result
on public.ai_trace_quality_checks (check_result, created_at desc)
where check_result != 'pass';

alter table public.ai_trace_quality_checks enable row level security;

create policy "ai_trace_quality_checks_insert_own"
on public.ai_trace_quality_checks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.ai_trace_runs
    where id = trace_run_id
      and user_id = auth.uid()
  )
);

create policy "ai_trace_quality_checks_select_admins"
on public.ai_trace_quality_checks
for select
to authenticated
using (public.is_admin());

alter table public.ai_trace_runs
  add column quality_summary jsonb;
