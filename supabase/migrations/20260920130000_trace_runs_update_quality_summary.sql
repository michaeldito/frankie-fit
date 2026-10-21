create policy "ai_trace_runs_update_own_quality_summary"
on public.ai_trace_runs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
