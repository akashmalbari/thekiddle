alter table public.newsletter_settings
  add column if not exists weekly_cutoff_at timestamptz;

update public.newsletter_settings
set weekly_cutoff_at = now() - interval '4 days'
where id = 1
  and weekly_cutoff_at is null;

alter table public.newsletter_settings
  alter column weekly_cutoff_at set default (now() - interval '4 days');
