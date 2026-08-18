drop policy "ai_trace_runs_select_admins" on public.ai_trace_runs;

create policy "ai_trace_runs_select_admins"
on public.ai_trace_runs
for select
to authenticated
using (
  public.is_admin()
  and public.is_reviewable_account(user_id)
);
