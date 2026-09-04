alter table public.eval_run_items
  drop constraint eval_run_items_pillar_check;

alter table public.eval_run_items
  add constraint eval_run_items_pillar_check
  check (pillar in ('activity', 'diet', 'lifestyle', 'wellness', 'summary'));
