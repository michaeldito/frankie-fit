alter table public.workout_sessions
  add column program_slug text,
  add column program_day integer check (program_day is null or program_day > 0);

create index workout_sessions_user_id_program_slug_program_day_idx
  on public.workout_sessions (user_id, program_slug, program_day);

create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_slug text not null,
  start_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, program_slug)
);

create trigger program_enrollments_set_updated_at
before update on public.program_enrollments
for each row
execute function public.set_updated_at();

alter table public.program_enrollments enable row level security;

create policy "program_enrollments_select_own"
on public.program_enrollments
for select
to authenticated
using (auth.uid() = user_id);

create policy "program_enrollments_insert_own"
on public.program_enrollments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "program_enrollments_update_own"
on public.program_enrollments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "program_enrollments_delete_own"
on public.program_enrollments
for delete
to authenticated
using (auth.uid() = user_id);

create policy "program_enrollments_select_reviewable_for_admins"
on public.program_enrollments
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);
