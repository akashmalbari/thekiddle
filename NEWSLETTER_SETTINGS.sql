-- Newsletter send safety settings (DB-backed)
-- Run in Supabase SQL editor

create table if not exists public.newsletter_settings (
  id int primary key,
  test_mode boolean not null default true,
  test_email text,
  updated_at timestamptz not null default now()
);

insert into public.newsletter_settings (id, test_mode, test_email)
values (1, true, null)
on conflict (id) do nothing;

create or replace function public.set_newsletter_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_newsletter_settings_updated_at on public.newsletter_settings;
create trigger trg_newsletter_settings_updated_at
before update on public.newsletter_settings
for each row execute function public.set_newsletter_settings_updated_at();
