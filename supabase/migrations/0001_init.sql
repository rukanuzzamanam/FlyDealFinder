-- FlyDealFinder initial schema
-- Run against a Postgres/Supabase database. Safe to re-run (uses IF NOT EXISTS).

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists destinations (
  id text primary key,
  city text not null,
  country text not null,
  airport_code text not null,
  airport_name text not null,
  region text not null,
  emoji text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists destinations_active_idx on destinations (active);
create index if not exists destinations_airport_code_idx on destinations (airport_code);

create table if not exists searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users (id) on delete set null,
  origin text not null,
  destination text not null,
  departure_date date not null,
  return_date date,
  passengers integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists searches_created_at_idx on searches (created_at desc);
create index if not exists searches_origin_destination_idx on searches (origin, destination);

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  origin text not null,
  destination text not null,
  target_price numeric(10, 2) not null,
  currency text not null default 'AUD',
  departure_date date,
  return_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists price_alerts_active_idx on price_alerts (active);
create index if not exists price_alerts_user_id_idx on price_alerts (user_id);

-- Row Level Security: all writes/reads for these tables happen server-side
-- via the Supabase service role key, which bypasses RLS. Enabling RLS with
-- no public policies means the anon/public key (if ever exposed) cannot
-- read or write anything here.
alter table users enable row level security;
alter table destinations enable row level security;
alter table searches enable row level security;
alter table price_alerts enable row level security;

-- Destinations are safe to expose publicly for read (they're already
-- shipped in the static config bundle), which is useful if a future
-- public-facing admin or storefront queries them directly with anon key.
drop policy if exists "Public can read active destinations" on destinations;
create policy "Public can read active destinations" on destinations
  for select
  using (active = true);
