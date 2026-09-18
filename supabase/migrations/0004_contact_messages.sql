-- Contact form submissions. Run after 0001_init.sql. Safe to re-run (uses IF NOT EXISTS).

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_resolved_idx on contact_messages (resolved);
create index if not exists contact_messages_created_at_idx on contact_messages (created_at desc);

alter table contact_messages enable row level security;
-- No public policies: all reads/writes happen server-side via the service
-- role key, which bypasses RLS (see src/lib/db/supabase.ts).
