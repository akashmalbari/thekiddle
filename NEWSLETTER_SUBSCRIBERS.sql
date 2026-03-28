-- Subscriber capture table for sample newsletter + conversion tracking
-- Run in Supabase SQL editor

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'landing_page',
  is_subscribed boolean not null default false,
  subscribed_at timestamptz,
  first_sample_sent_at timestamptz,
  last_sample_sent_at timestamptz,
  sample_sent_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email),
  constraint newsletter_subscribers_email_format check (position('@' in email) > 1),
  constraint newsletter_subscribers_subscribed_at_required check (
    (is_subscribed = false and subscribed_at is null)
    or (is_subscribed = true and subscribed_at is not null)
  )
);

create or replace function public.set_newsletter_subscribers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();

  if new.email is not null then
    new.email = lower(trim(new.email));
  end if;

  if new.last_sample_sent_at is not null then
    if new.first_sample_sent_at is null then
      if tg_op = 'INSERT' then
        new.first_sample_sent_at = new.last_sample_sent_at;
      else
        new.first_sample_sent_at = coalesce(old.first_sample_sent_at, new.last_sample_sent_at);
      end if;
    end if;

    if tg_op = 'INSERT' then
      new.sample_sent_count = greatest(coalesce(new.sample_sent_count, 0), 1);
    elsif coalesce(old.last_sample_sent_at, 'epoch'::timestamptz) <> new.last_sample_sent_at then
      new.sample_sent_count = coalesce(old.sample_sent_count, 0) + 1;
    end if;
  end if;

  if new.is_subscribed = true and new.subscribed_at is null then
    if tg_op = 'INSERT' then
      new.subscribed_at = now();
    elsif old.is_subscribed = false then
      new.subscribed_at = now();
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_newsletter_subscribers_updated_at on public.newsletter_subscribers;
create trigger trg_newsletter_subscribers_updated_at
before insert or update on public.newsletter_subscribers
for each row execute function public.set_newsletter_subscribers_updated_at();

create index if not exists idx_newsletter_subscribers_is_subscribed
  on public.newsletter_subscribers (is_subscribed);

create index if not exists idx_newsletter_subscribers_last_sample_sent_at
  on public.newsletter_subscribers (last_sample_sent_at desc);
