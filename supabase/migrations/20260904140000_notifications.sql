create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('checkin_reminder')),
  title text not null,
  body text not null,
  action_url text,
  metadata_json jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index notifications_user_id_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

create policy "notifications_insert_own"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "notifications_delete_own"
on public.notifications
for delete
to authenticated
using (auth.uid() = user_id);
