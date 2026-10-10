alter table public.ai_trace_quality_checks
  drop constraint ai_trace_quality_checks_check_result_check;

alter table public.ai_trace_quality_checks
  add constraint ai_trace_quality_checks_check_result_check
  check (check_result in ('pass', 'warn', 'fail', 'skip'));
