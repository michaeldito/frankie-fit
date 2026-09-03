create type public.workout_session_type as enum ('simple', 'circuit');
create type public.workout_weight_unit as enum ('lb', 'kg');

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_log_id uuid references public.activity_logs (id) on delete set null,
  session_type public.workout_session_type not null default 'simple',
  title text,
  notes text,
  wod_template_slug text,
  rounds_count integer check (rounds_count is null or rounds_count > 0),
  for_time boolean not null default false,
  total_time_seconds integer check (total_time_seconds is null or total_time_seconds >= 0),
  logged_for_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_slug text not null,
  exercise_name text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number integer not null check (set_number > 0),
  reps integer check (reps is null or reps >= 0),
  weight numeric(6,2) check (weight is null or weight >= 0),
  weight_unit public.workout_weight_unit not null default 'lb',
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index workout_sessions_user_id_logged_for_date_idx on public.workout_sessions (user_id, logged_for_date desc);
create index workout_exercises_session_id_position_idx on public.workout_exercises (session_id, position);
create index workout_sets_workout_exercise_id_set_number_idx on public.workout_sets (workout_exercise_id, set_number);

create trigger workout_sessions_set_updated_at
before update on public.workout_sessions
for each row
execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy "workout_sessions_select_own"
on public.workout_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "workout_sessions_insert_own"
on public.workout_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "workout_sessions_update_own"
on public.workout_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workout_sessions_delete_own"
on public.workout_sessions
for delete
to authenticated
using (auth.uid() = user_id);

create policy "workout_sessions_select_reviewable_for_admins"
on public.workout_sessions
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);

create policy "workout_exercises_select_own"
on public.workout_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where id = session_id
      and user_id = auth.uid()
  )
);

create policy "workout_exercises_insert_own"
on public.workout_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions
    where id = session_id
      and user_id = auth.uid()
  )
);

create policy "workout_exercises_update_own"
on public.workout_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where id = session_id
      and user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions
    where id = session_id
      and user_id = auth.uid()
  )
);

create policy "workout_exercises_delete_own"
on public.workout_exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions
    where id = session_id
      and user_id = auth.uid()
  )
);

create policy "workout_exercises_select_reviewable_for_admins"
on public.workout_exercises
for select
to authenticated
using (
  public.is_admin()
  and exists (
    select 1
    from public.workout_sessions
    where id = session_id
      and public.is_reviewable_account(user_id)
  )
);

create policy "workout_sets_select_own"
on public.workout_sets
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = workout_exercise_id
      and ws.user_id = auth.uid()
  )
);

create policy "workout_sets_insert_own"
on public.workout_sets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = workout_exercise_id
      and ws.user_id = auth.uid()
  )
);

create policy "workout_sets_update_own"
on public.workout_sets
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = workout_exercise_id
      and ws.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = workout_exercise_id
      and ws.user_id = auth.uid()
  )
);

create policy "workout_sets_delete_own"
on public.workout_sets
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = workout_exercise_id
      and ws.user_id = auth.uid()
  )
);

create policy "workout_sets_select_reviewable_for_admins"
on public.workout_sets
for select
to authenticated
using (
  public.is_admin()
  and exists (
    select 1
    from public.workout_exercises we
    join public.workout_sessions ws on ws.id = we.session_id
    where we.id = workout_exercise_id
      and public.is_reviewable_account(ws.user_id)
  )
);
