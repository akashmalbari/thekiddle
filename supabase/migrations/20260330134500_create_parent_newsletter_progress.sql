create table if not exists public.parent_newsletter_progress (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade,
  newsletter_id integer references public.newsletters(id),
  sent_at timestamp default now(),
  status text default 'SENT',
  unique(parent_id, newsletter_id)
);

create index if not exists parent_newsletter_progress_parent_id_idx
  on public.parent_newsletter_progress(parent_id);

create index if not exists parent_newsletter_progress_newsletter_id_idx
  on public.parent_newsletter_progress(newsletter_id);
