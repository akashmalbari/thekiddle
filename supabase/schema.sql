-- The Kiddle - Complete Supabase Schema (rebuild)
-- This script is idempotent for a clean rebuild workflow.

begin;

create extension if not exists pgcrypto;

-- =========================
-- Cleanup (drop old objects)
-- =========================

drop table if exists public.newsletter_subscribers cascade;
drop table if exists public.newsletter_send_logs cascade;
drop table if exists public.newsletters cascade;
drop table if exists public.newsletter_settings cascade;
drop table if exists public.payment_transactions cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.billing_customers cascade;
drop table if exists public.webhook_events cascade;
drop table if exists public.children cascade;
drop table if exists public.parents cascade;
drop table if exists public.contact_queries cascade;
drop table if exists public.country_pricing cascade;
drop table if exists public.admins cascade;

drop type if exists public.subscriber_state_enum cascade;
drop type if exists public.newsletter_status_enum cascade;
drop type if exists public.newsletter_log_status_enum cascade;
drop type if exists public.access_tier_enum cascade;
drop type if exists public.billing_provider_enum cascade;
drop type if exists public.subscription_plan_enum cascade;
drop type if exists public.payment_status_enum cascade;
drop type if exists public.payment_type_enum cascade;
drop type if exists public.webhook_processing_status_enum cascade;

-- =========================
-- Types / Enums
-- =========================

create type public.subscriber_state_enum as enum ('potential', 'active', 'unsubscribed');
create type public.newsletter_status_enum as enum ('draft', 'uploaded', 'sending', 'sent', 'failed');
create type public.newsletter_log_status_enum as enum ('sent', 'failed');
create type public.access_tier_enum as enum ('free', 'paid');
create type public.billing_provider_enum as enum ('stripe');
create type public.subscription_plan_enum as enum ('monthly', 'yearly');
create type public.payment_status_enum as enum ('paid', 'failed', 'pending');
create type public.payment_type_enum as enum ('invoice', 'charge', 'refund');
create type public.webhook_processing_status_enum as enum ('received', 'processed', 'failed');

-- =========================
-- Core Users / Subscribers
-- =========================

create table public.parents (
  id uuid primary key default gen_random_uuid(),
  name text,
  parent_name text,
  email text not null unique,

  -- unified subscriber lifecycle
  subscriber_state public.subscriber_state_enum not null default 'potential',
  marketing_source text,
  sample_requested_at timestamptz,
  subscription_intent_at timestamptz,
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,

  -- billing/subscription linkage
  auth_user_id uuid references auth.users(id) on delete set null,
  access_tier public.access_tier_enum not null default 'free',
  subscription_status text,
  billing_country_code text,
  active_subscription_id bigint,

  -- email preference state (separate from billing)
  marketing_email_opt_in boolean not null default true,
  marketing_unsubscribed_at timestamptz,
  marketing_unsubscribe_source text,
  email_token_version integer not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint parents_email_valid check (position('@' in email) > 1),
  constraint parents_name_not_blank check (name is null or length(trim(name)) > 0),
  constraint parents_parent_name_not_blank check (parent_name is null or length(trim(parent_name)) > 0),
  constraint parents_billing_country_code_len check (billing_country_code is null or char_length(billing_country_code) = 2)
);

create index parents_subscriber_state_idx on public.parents(subscriber_state);
create index parents_marketing_opt_in_idx on public.parents(marketing_email_opt_in);
create index parents_auth_user_id_idx on public.parents(auth_user_id);
create index parents_created_at_idx on public.parents(created_at desc);

create table public.children (
  id bigint generated always as identity primary key,
  parent_id uuid not null references public.parents(id) on delete cascade,
  age_value integer not null,
  age_unit text not null default 'years',
  created_at timestamptz not null default now(),

  constraint children_age_positive check (age_value > 0),
  constraint children_age_unit_valid check (age_unit in ('years')),
  constraint children_unique_per_parent_age unique (parent_id, age_value, age_unit)
);

create index children_parent_id_idx on public.children(parent_id);

-- =========================
-- Admin access mapping
-- =========================
-- Admin IDs map to auth.users.id

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- =========================
-- Newsletter system
-- =========================

create table public.newsletter_settings (
  id integer primary key,
  test_mode boolean not null default false,
  test_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint newsletter_settings_singleton check (id = 1)
);

insert into public.newsletter_settings (id, test_mode, test_email)
values (1, false, null)
on conflict (id) do nothing;

create table public.newsletters (
  id bigint generated always as identity primary key,
  title text not null,
  issue_date date not null,
  pdf_path text,
  status public.newsletter_status_enum not null default 'draft',
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  send_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index newsletters_created_at_idx on public.newsletters(created_at desc);
create index newsletters_status_idx on public.newsletters(status);

create table public.newsletter_send_logs (
  id bigint generated always as identity primary key,
  newsletter_id bigint not null references public.newsletters(id) on delete cascade,
  subscriber_email text not null,
  status public.newsletter_log_status_enum not null,
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create index newsletter_send_logs_newsletter_id_idx on public.newsletter_send_logs(newsletter_id);
create index newsletter_send_logs_created_at_idx on public.newsletter_send_logs(created_at desc);

-- =========================
-- Pricing + Contact
-- =========================

create table public.country_pricing (
  id bigint generated always as identity primary key,
  country_code text not null unique,
  country_name text not null,
  currency_code text not null,
  currency_symbol text not null,
  monthly_price numeric(10,2) not null,
  yearly_price numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint country_pricing_country_code_len check (char_length(country_code) = 2),
  constraint country_pricing_currency_code_len check (char_length(currency_code) = 3),
  constraint country_pricing_prices_non_negative check (monthly_price >= 0 and yearly_price >= 0)
);

create index country_pricing_active_idx on public.country_pricing(is_active, country_code);

insert into public.country_pricing (
  country_code, country_name, currency_code, currency_symbol, monthly_price, yearly_price, is_active
)
values ('US', 'United States', 'USD', '$', 1.99, 21.99, true)
on conflict (country_code) do nothing;

create table public.contact_queries (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  answered boolean not null default false,
  answered_at timestamptz,
  answered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint contact_queries_email_valid check (position('@' in email) > 1)
);

create index contact_queries_created_at_idx on public.contact_queries(created_at desc);
create index contact_queries_answered_idx on public.contact_queries(answered);

-- =========================
-- Billing + webhook events
-- =========================

create table public.billing_customers (
  id bigint generated always as identity primary key,
  parent_id uuid not null references public.parents(id) on delete cascade,
  provider public.billing_provider_enum not null,
  provider_customer_id text not null,
  email_snapshot text,
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint billing_customers_parent_provider_unique unique (parent_id, provider),
  constraint billing_customers_provider_customer_unique unique (provider, provider_customer_id),
  constraint billing_customers_country_code_len check (country_code is null or char_length(country_code) = 2)
);

create index billing_customers_parent_id_idx on public.billing_customers(parent_id);

create table public.subscriptions (
  id bigint generated always as identity primary key,
  parent_id uuid not null references public.parents(id) on delete cascade,
  billing_customer_id bigint references public.billing_customers(id) on delete set null,
  plan_code public.subscription_plan_enum not null,
  provider public.billing_provider_enum not null,
  provider_subscription_id text not null,
  status text not null,
  country_code text,
  currency_code text,
  amount numeric(10,2),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  cancel_requested_at timestamptz,
  cancel_source text,
  cancel_reason text,
  cancel_feedback text,
  manage_token_version integer not null default 1,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscriptions_provider_subscription_unique unique (provider, provider_subscription_id),
  constraint subscriptions_country_code_len check (country_code is null or char_length(country_code) = 2),
  constraint subscriptions_currency_code_len check (currency_code is null or char_length(currency_code) = 3)
);

create index subscriptions_parent_id_idx on public.subscriptions(parent_id);
create index subscriptions_status_idx on public.subscriptions(status);

alter table public.parents
  add constraint parents_active_subscription_fk
  foreign key (active_subscription_id)
  references public.subscriptions(id)
  on delete set null;

create table public.payment_transactions (
  id bigint generated always as identity primary key,
  parent_id uuid references public.parents(id) on delete set null,
  provider public.billing_provider_enum not null,
  provider_payment_id text,
  provider_invoice_id text,
  type public.payment_type_enum not null,
  status public.payment_status_enum not null,
  amount numeric(10,2),
  currency_code text,
  raw_metadata jsonb,
  created_at timestamptz not null default now(),

  constraint payment_transactions_currency_code_len check (currency_code is null or char_length(currency_code) = 3)
);

create index payment_transactions_parent_id_idx on public.payment_transactions(parent_id);
create index payment_transactions_created_at_idx on public.payment_transactions(created_at desc);

create table public.webhook_events (
  id bigint generated always as identity primary key,
  provider public.billing_provider_enum not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processing_status public.webhook_processing_status_enum not null default 'received',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint webhook_events_provider_event_unique unique (provider, provider_event_id)
);

create index webhook_events_created_at_idx on public.webhook_events(created_at desc);
create index webhook_events_processing_status_idx on public.webhook_events(processing_status);

-- =========================
-- Trigger functions
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_parent_subscriber_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.subscriber_state = 'active' and new.subscribed_at is null then
    new.subscribed_at = now();
  end if;

  if new.subscriber_state = 'unsubscribed' and new.unsubscribed_at is null then
    new.unsubscribed_at = now();
  end if;

  if new.subscriber_state in ('potential', 'active') then
    new.unsubscribed_at = null;
  end if;

  return new;
end;
$$;

create or replace function public.sync_contact_answered_fields()
returns trigger
language plpgsql
as $$
begin
  if new.answered = true and new.answered_at is null then
    new.answered_at = now();
  end if;

  if new.answered = false then
    new.answered_at = null;
    new.answered_by = null;
  end if;

  return new;
end;
$$;

-- =========================
-- Triggers
-- =========================

create trigger trg_parents_updated_at
before update on public.parents
for each row execute function public.set_updated_at();

create trigger trg_newsletters_updated_at
before update on public.newsletters
for each row execute function public.set_updated_at();

create trigger trg_newsletter_settings_updated_at
before update on public.newsletter_settings
for each row execute function public.set_updated_at();

create trigger trg_country_pricing_updated_at
before update on public.country_pricing
for each row execute function public.set_updated_at();

create trigger trg_contact_queries_updated_at
before update on public.contact_queries
for each row execute function public.set_updated_at();

create trigger trg_billing_customers_updated_at
before update on public.billing_customers
for each row execute function public.set_updated_at();

create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger trg_webhook_events_updated_at
before update on public.webhook_events
for each row execute function public.set_updated_at();

create trigger trg_parents_sync_subscriber_timestamps
before insert or update on public.parents
for each row execute function public.sync_parent_subscriber_timestamps();

create trigger trg_contact_queries_sync_answered_fields
before insert or update on public.contact_queries
for each row execute function public.sync_contact_answered_fields();

-- =========================
-- RLS
-- =========================

alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.admins enable row level security;
alter table public.newsletter_settings enable row level security;
alter table public.newsletters enable row level security;
alter table public.newsletter_send_logs enable row level security;
alter table public.country_pricing enable row level security;
alter table public.contact_queries enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.webhook_events enable row level security;

-- helper policy expression: admin users are auth users existing in public.admins

-- admins table
create policy admins_self_select on public.admins
for select
using (id = auth.uid());

-- parents: allow anon creates for signup/subscribe; admins full access
create policy parents_insert_anon on public.parents
for insert
to anon, authenticated
with check (true);

create policy parents_select_admin on public.parents
for select
to authenticated
using (exists (select 1 from public.admins a where a.id = auth.uid()));

create policy parents_update_admin on public.parents
for update
to authenticated
using (exists (select 1 from public.admins a where a.id = auth.uid()))
with check (exists (select 1 from public.admins a where a.id = auth.uid()));

-- children: allow anon insert for signup; admins read/update/delete
create policy children_insert_anon on public.children
for insert
to anon, authenticated
with check (true);

create policy children_select_admin on public.children
for select
to authenticated
using (exists (select 1 from public.admins a where a.id = auth.uid()));

create policy children_modify_admin on public.children
for all
to authenticated
using (exists (select 1 from public.admins a where a.id = auth.uid()))
with check (exists (select 1 from public.admins a where a.id = auth.uid()));

-- country_pricing: public can read active rows; admins full CRUD
create policy country_pricing_public_select_active on public.country_pricing
for select
to anon, authenticated
using (is_active = true or exists (select 1 from public.admins a where a.id = auth.uid()));

create policy country_pricing_admin_write on public.country_pricing
for all
to authenticated
using (exists (select 1 from public.admins a where a.id = auth.uid()))
with check (exists (select 1 from public.admins a where a.id = auth.uid()));

-- contact_queries: public insert; admins read/update
create policy contact_queries_insert_public on public.contact_queries
for insert
to anon, authenticated
with check (true);

create policy contact_queries_admin_select on public.contact_queries
for select
to authenticated
using (exists (select 1 from public.admins a where a.id = auth.uid()));

create policy contact_queries_admin_update on public.contact_queries
for update
to authenticated
using (exists (select 1 from public.admins a where a.id = auth.uid()))
with check (exists (select 1 from public.admins a where a.id = auth.uid()));

-- newsletter / billing / webhook tables are service-role driven in API routes.
-- Keep them inaccessible to anon/authenticated clients by default.

commit;
