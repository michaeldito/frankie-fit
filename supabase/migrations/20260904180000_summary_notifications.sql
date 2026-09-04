alter table public.notifications drop constraint notifications_type_check;

alter table public.notifications add constraint notifications_type_check
  check (type in ('checkin_reminder', 'daily_summary', 'weekly_summary'));
