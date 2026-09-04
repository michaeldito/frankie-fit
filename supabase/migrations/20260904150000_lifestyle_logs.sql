create table public.lifestyle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_message_id uuid references public.conversation_messages (id) on delete set null,
  category text not null check (
    category in ('social', 'family', 'entertainment', 'travel', 'substance_alcohol', 'substance_cannabis', 'other')
  ),
  description text not null,
  logged_for_date date not null default current_date,
  metadata_json jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index lifestyle_logs_user_id_logged_for_date_idx on public.lifestyle_logs (user_id, logged_for_date desc);

create trigger lifestyle_logs_set_updated_at
before update on public.lifestyle_logs
for each row
execute function public.set_updated_at();

alter table public.lifestyle_logs enable row level security;

create policy "lifestyle_logs_select_own"
on public.lifestyle_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "lifestyle_logs_insert_own"
on public.lifestyle_logs
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

create policy "lifestyle_logs_update_own"
on public.lifestyle_logs
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

create policy "lifestyle_logs_delete_own"
on public.lifestyle_logs
for delete
to authenticated
using (auth.uid() = user_id);

create policy "lifestyle_logs_select_reviewable_for_admins"
on public.lifestyle_logs
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);
