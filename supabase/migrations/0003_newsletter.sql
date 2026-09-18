-- Newsletter subscribers. Run after 0001_init.sql. Safe to re-run (uses IF NOT EXISTS).

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  preferences text[] not null default '{}',
  subscribed boolean not null default true,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_subscribers_subscribed_idx on newsletter_subscribers (subscribed);

alter table newsletter_subscribers enable row level security;
-- No public policies: all reads/writes happen server-side via the service
-- role key, which bypasses RLS (see src/lib/db/supabase.ts).
