-- Billing foundation schema for The Kiddle
-- Run in Supabase SQL editor before enabling Stripe webhook processing

create table if not exists public.subscription_plans (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  billing_interval text not null check (billing_interval in ('month', 'year')),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_prices (
  id bigserial primary key,
  plan_id bigint not null references public.subscription_plans(id) on delete cascade,
  country_code text not null,
  currency_code text not null,
  amount numeric(10,2) not null,
  provider text not null default 'stripe',
  provider_price_id text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_price_id),
  unique (plan_id, country_code, provider)
);

create table if not exists public.billing_customers (
  id bigserial primary key,
  parent_id uuid not null references public.parents(id) on delete cascade,
  provider text not null,
  provider_customer_id text not null,
  email_snapshot text,
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, provider),
  unique (provider, provider_customer_id)
);

create table if not exists public.subscriptions (
  id bigserial primary key,
  parent_id uuid not null references public.parents(id) on delete cascade,
  billing_customer_id bigint references public.billing_customers(id) on delete set null,
  plan_code text not null,
  provider text not null default 'stripe',
  provider_subscription_id text not null,
  status text not null,
  country_code text,
  currency_code text,
  amount numeric(10,2),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

create table if not exists public.payment_transactions (
  id bigserial primary key,
  parent_id uuid references public.parents(id) on delete set null,
  subscription_id bigint references public.subscriptions(id) on delete set null,
  provider text not null default 'stripe',
  provider_payment_id text,
  provider_invoice_id text,
  provider_checkout_session_id text,
  type text not null,
  status text not null,
  amount numeric(10,2),
  currency_code text,
  raw_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id bigserial primary key,
  provider text not null,
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processing_status text not null default 'received',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parents
  add column if not exists access_tier text not null default 'free',
  add column if not exists subscription_status text,
  add column if not exists active_subscription_id bigint references public.subscriptions(id) on delete set null,
  add column if not exists billing_country_code text;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_subscription_plans_updated_at on public.subscription_plans;
create trigger trg_subscription_plans_updated_at
before update on public.subscription_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_billing_prices_updated_at on public.billing_prices;
create trigger trg_billing_prices_updated_at
before update on public.billing_prices
for each row execute function public.set_updated_at();

drop trigger if exists trg_billing_customers_updated_at on public.billing_customers;
create trigger trg_billing_customers_updated_at
before update on public.billing_customers
for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_payment_transactions_updated_at on public.payment_transactions;
create trigger trg_payment_transactions_updated_at
before update on public.payment_transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_webhook_events_updated_at on public.webhook_events;
create trigger trg_webhook_events_updated_at
before update on public.webhook_events
for each row execute function public.set_updated_at();

insert into public.subscription_plans (code, name, billing_interval, sort_order)
values
  ('monthly', 'Monthly Explorer', 'month', 1),
  ('yearly', 'Yearly Adventurer', 'year', 2)
on conflict (code) do update set
  name = excluded.name,
  billing_interval = excluded.billing_interval,
  sort_order = excluded.sort_order,
  updated_at = now();
