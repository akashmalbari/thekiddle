create table if not exists public.newsletter_settings (
  id integer primary key,
  test_mode boolean not null default false,
  test_email text,
  weekly_cutoff_at timestamptz not null default (now() - interval '6 days')
);

alter table public.newsletter_settings
  add column if not exists test_mode boolean not null default false,
  add column if not exists test_email text,
  add column if not exists weekly_cutoff_at timestamptz;

alter table public.newsletter_settings
  alter column weekly_cutoff_at set default (now() - interval '6 days');

update public.newsletter_settings
set weekly_cutoff_at = now() - interval '6 days'
where weekly_cutoff_at is null;

insert into public.newsletter_settings (id, weekly_cutoff_at)
values (1, now() - interval '6 days')
on conflict (id) do update
set weekly_cutoff_at = coalesce(
  public.newsletter_settings.weekly_cutoff_at,
  excluded.weekly_cutoff_at
);

alter table public.newsletter_settings
  alter column weekly_cutoff_at set not null;

alter table public.newsletter_settings enable row level security;
