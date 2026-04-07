-- Enforce idempotency/concurrency safety for newsletter progress claims
create unique index if not exists parent_newsletter_progress_parent_newsletter_unique
  on public.parent_newsletter_progress (parent_id, newsletter_id);

-- Remove selected/production mode config storage if present
alter table if exists public.newsletter_settings
  drop column if exists test_mode,
  drop column if exists test_email,
  drop column if exists mode,
  drop column if exists environment,
  drop column if exists is_test;

drop table if exists public.newsletter_settings;
