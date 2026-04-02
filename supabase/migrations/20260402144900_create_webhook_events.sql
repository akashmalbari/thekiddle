create table if not exists public.webhook_events (
  id bigserial primary key,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb,
  processing_status text not null default 'received',
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists webhook_events_provider_event_unique
  on public.webhook_events (provider, provider_event_id);

create index if not exists webhook_events_provider_created_at_idx
  on public.webhook_events (provider, created_at desc);
