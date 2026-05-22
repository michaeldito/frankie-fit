create table public.ai_trace_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  thread_id uuid not null references public.conversation_threads (id) on delete cascade,
  source_message_id uuid references public.conversation_messages (id) on delete set null,
  assistant_message_id uuid references public.conversation_messages (id) on delete set null,
  user_email text,
  user_display_name text,
  thread_title text,
  orchestration_mode text not null,
  extraction_source text not null,
  used_model boolean not null default false,
  model_name text,
  prompt_version text,
  intent text,
  raw_user_message text not null,
  profile_snapshot jsonb not null default '{}'::jsonb,
  recent_context_snapshot jsonb not null default '{}'::jsonb,
  extracted_payload jsonb not null default '{}'::jsonb,
  tool_calls jsonb not null default '[]'::jsonb,
  tool_results jsonb not null default '{}'::jsonb,
  persisted_log_ids jsonb not null default '{}'::jsonb,
  needs_clarification boolean not null default false,
  fallback_reason text,
  final_reply text not null,
  run_status text not null default 'completed',
  error_stage text,
  error_message text,
  latency_ms integer,
  created_at timestamptz not null default timezone('utc', now())
);

create index ai_trace_runs_user_id_created_at_idx
on public.ai_trace_runs (user_id, created_at desc);

create index ai_trace_runs_user_email_created_at_idx
on public.ai_trace_runs (user_email, created_at desc);

create index ai_trace_runs_thread_id_created_at_idx
on public.ai_trace_runs (thread_id, created_at desc);

create index ai_trace_runs_run_status_created_at_idx
on public.ai_trace_runs (run_status, created_at desc);

alter table public.ai_trace_runs enable row level security;

create policy "ai_trace_runs_insert_own"
on public.ai_trace_runs
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
  and (
    source_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = source_message_id
        and user_id = auth.uid()
    )
  )
  and (
    assistant_message_id is null
    or exists (
      select 1
      from public.conversation_messages
      where id = assistant_message_id
        and user_id = auth.uid()
    )
  )
);

create policy "ai_trace_runs_select_admins"
on public.ai_trace_runs
for select
to authenticated
using (public.is_admin());
