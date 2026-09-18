# FlyDealFinder

**Find cheap flights anywhere in the world.**

FlyDealFinder is a flight-deal discovery MVP built around one core question:
*"I don't know where I want to go — show me the cheapest places I can fly."*
Users pick a departure airport, optionally pick "Anywhere" as the
destination, and get back real fares sourced from the
[Duffel Flights API](https://duffel.com/docs/api) — checked on search, and
cached for a short time afterward (never invented, but not a guaranteed
real-time feed on every page view — see [`docs/revenue.md`](docs/revenue.md)
and [`docs/product-roadmap.md`](docs/product-roadmap.md) for what's real vs.
planned).

## Table of contents

- [Project overview](#project-overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Duffel setup](#duffel-setup)
- [Database setup](#database-setup)
- [Local development](#local-development)
- [Testing](#testing)
- [Production build & deployment](#production-build--deployment)
- [How to add destinations](#how-to-add-destinations)
- [How to add another flight provider](#how-to-add-another-flight-provider)
- [Known limitations](#known-limitations)
- [Further documentation](#further-documentation)

## Project overview

- **Search** — one-way/return search between two specific airports.
- **Anywhere search** — search a configurable batch of destinations
  concurrently and show the cheapest fare to each.
- **Sort & filter** — cheapest / fastest / fewest stops / departure time;
  price, stops, airline, and time-of-day filters.
- **Price alerts** — save a target price to a Postgres table (email
  notifications are not implemented yet — see [Known limitations](#known-limitations)).
- **Deals & Explore** (`/deals`, `/explore`) — live cheapest fares across the
  full destination list, filterable by region/price/direct-only.
- **Booking** — via Duffel Links (`src/lib/booking-providers/`), gated
  behind commercial configuration — see [`docs/revenue.md`](docs/revenue.md).
- **SEO landing pages** — a small, hand-authored set (`/cheap-flights-from-sydney`
  and three route pages) with structured data — see [`docs/seo.md`](docs/seo.md).
- **Legal/trust pages** — `/about`, `/contact`, `/privacy`, `/terms`,
  `/cookies`, `/disclaimer`, `/affiliate-disclosure`.
- **Admin foundation** — a Basic-Auth-protected `/admin` page listing
  configured destinations and integration status.

No flight price is ever invented. If a live search fails or the provider
isn't configured, the UI shows an empty state, never a fake number.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the full breakdown.
In short:

```
UI (Client Components)
   │  fetch()
   ▼
API routes (src/app/api/**)     — validate input (Zod), rate limit, cache
   │
   ▼
FlightProvider interface (src/lib/flight-providers/types.ts)
   │
   ▼
DuffelFlightProvider             — the only implementation today
   │
   ▼
Duffel API (https://api.duffel.com)
```

The UI and API routes only ever depend on the generic `FlightProvider`
interface and the app's own normalized `FlightResult` type — never on
Duffel's response shape directly. That's what makes it possible to add a
second provider later without touching the frontend.

## Installation

Requires Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
# fill in .env.local — see "Environment variables" below
npm run dev
```

Open http://localhost:3000.

## Environment variables

Set these in `.env.local` (never committed — see `.gitignore`).

| Variable | Required | Description |
|---|---|---|
| `DUFFEL_API_TOKEN` | Yes, for real search results | Server-side only Duffel access token. Without it, search endpoints return a friendly 503 and the homepage deals section shows an empty state — the app still runs. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public site URL used for metadata, Open Graph tags, and the sitemap. No trailing slash. |
| `DATABASE_URL` | Optional | Reserved for tooling (e.g. a migration runner) that expects a standard Postgres connection string. The app itself talks to Postgres via Supabase's client, not this variable directly. |
| `SUPABASE_URL` | Optional | Supabase project URL. Without it, destination management falls back to the static list in `src/lib/destinations.ts`, and price alerts return a 503. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | **Server-only** service role key (bypasses RLS). Never exposed to the client — see `src/lib/db/supabase.ts`. |
| `ADMIN_PASSWORD` | Optional | Basic-Auth password for `/admin`. If unset, `/admin` returns 503 (fails closed, not open). |
| `DUFFEL_LINKS_ENABLED` | Optional | Set to `true` to activate booking via Duffel Links. Requires a Duffel account approved for Duffel Payments — see [`docs/revenue.md`](docs/revenue.md). Without it, "View Deal" always shows "Booking coming soon". |
| `DUFFEL_LINKS_MODE` | Optional | `test` (default) or `live` — shown verbatim to users as a "Test Booking" badge or a real booking link. Never inferred automatically; set to `live` only once real payments are confirmed working. |
| `BOOKING_MARKUP_RATE` | Optional | Decimal markup rate applied to Duffel Links bookings, e.g. `0.05` for 5%. |
| `CONTACT_EMAIL` | Optional | Shown on `/contact` as an alternative way to reach you. Contact form submissions are stored in Supabase, not emailed — no email provider is configured yet. |

`DUFFEL_API_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` are read only in
server-side code (API routes, `src/lib/db/*`, `src/lib/flight-providers/*`)
and are never included in the client JS bundle — Next.js only exposes
`NEXT_PUBLIC_*` variables to the browser.

## Duffel setup

1. Create a Duffel account at https://app.duffel.com and switch to
   **test mode** for development.
2. Go to **Developers → Access tokens** and create a token.
3. Put it in `.env.local` as `DUFFEL_API_TOKEN`.

See [`docs/duffel-integration.md`](docs/duffel-integration.md) for exactly
which Duffel endpoints and fields this app uses, and what to check first if
something in the Duffel integration needs updating.

**Note on booking:** Duffel does not provide a booking deep-link/affiliate
URL directly on a search offer. Booking is implemented via **Duffel Links**
(`src/lib/booking-providers/`), a Duffel-hosted checkout — but it stays
inactive ("Booking coming soon") until `DUFFEL_LINKS_ENABLED` is explicitly
set, since it requires a separately-approved Duffel Payments account. See
[`docs/revenue.md`](docs/revenue.md) for the full picture.

## Database setup

The app runs without a database — flight search, Anywhere search, and the
homepage deals section all work with zero DB configuration. A database is
only needed for **price alerts** and for **managing destinations without a
redeploy**.

1. Create a Supabase project (or point at any Postgres instance and adapt
   `src/lib/db/supabase.ts` if not using Supabase).
2. Run the migrations in order against your database:
   ```bash
   # via the Supabase SQL editor, or `psql`, or the Supabase CLI:
   supabase/migrations/0001_init.sql
   supabase/migrations/0002_seed_destinations.sql
   ```
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

Tables created: `users`, `destinations`, `searches`, `price_alerts`. See
the migration file for exact columns and indexes.

## Local development

```bash
npm run dev          # start the dev server
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript check
npm run test          # run the test suite once
npm run test:watch    # watch mode
```

## Testing

`npm run test` runs the Vitest suite covering the app's core business
logic (not UI rendering):

- Zod validation schemas (dates, past-date rejection, origin/destination
  equality, passenger limits, price alert email/price).
- Duration parsing/formatting and price/date formatting.
- Sorting (cheapest / fastest / fewest stops / departure time) and
  filtering (price, stops, airline, time-of-day) — including that they
  compose with AND semantics and don't mutate their input.
- `DuffelFlightProvider` offer normalization (via a mocked `fetch`):
  correct field mapping, stop counting from segment count, price parsing,
  and mapping of Duffel HTTP error statuses (422/429/etc.) to typed
  `FlightProviderError` codes.
- `searchAnywhere`: sorts by cheapest price, excludes the origin airport,
  keeps going when one destination search fails or times out, respects a
  max-price filter, and bounds concurrent provider calls.

## Production build & deployment

```bash
npm run build
npm run start
```

`npm run build` must succeed with zero TypeScript errors before deploying.

Deployment is set up for **Vercel** — see
[`docs/deployment.md`](docs/deployment.md) for the step-by-step guide,
including which environment variables to set in the Vercel dashboard.

## How to add destinations

The "Anywhere" destination list lives in two places that should stay in
sync:

1. `src/lib/destinations.ts` — the static fallback, always available.
2. `supabase/migrations/0002_seed_destinations.sql` — seeds the
   `destinations` table, used instead of the static list once Supabase is
   configured (see `src/lib/db/destinations.ts`).

To add a destination:

- Append an entry to `DEFAULT_DESTINATIONS` in `src/lib/destinations.ts`
  (`id`, `city`, `country`, `airportCode`, `airportName`, `region`, `emoji`).
- If a database is configured, insert the same row into `destinations`
  (via the seed migration, the Supabase SQL editor, or a future admin
  form — `/admin` currently only lists destinations, it doesn't edit them
  yet).

`ANYWHERE_SEARCH_BATCH_LIMIT` in `src/lib/destinations.ts` caps how many
destinations a single Anywhere search fans out to; raise it once caching
and/or a background job queue are in place for larger destination lists.

## How to add another flight provider

1. Implement the `FlightProvider` interface
   (`src/lib/flight-providers/types.ts`):
   ```ts
   interface FlightProvider {
     readonly name: string;
     searchFlights(params: FlightSearchParams): Promise<FlightSearchResult>;
   }
   ```
   Your implementation is responsible for mapping the provider's response
   into the app's normalized `FlightResult` shape (`src/lib/types.ts`) —
   see `src/lib/flight-providers/duffel.ts` for the reference
   implementation.
2. Register it in `src/lib/flight-providers/index.ts`'s
   `getFlightProvider()` — e.g. branch on a `FLIGHT_PROVIDER` env var to
   choose between providers, or wrap several in a fan-out provider that
   merges and de-dupes results.

Nothing outside `src/lib/flight-providers/` needs to change: API routes,
`searchAnywhere`, and every UI component only ever see `FlightResult` /
`FlightSearchResult`.

## Known limitations

- **Booking is gated behind commercial configuration.** The Duffel Links
  integration (`src/lib/booking-providers/`) is implemented, but requires an
  approved Duffel Payments account before `DUFFEL_LINKS_ENABLED` can safely
  be turned on — see `docs/revenue.md`. Until then, every "View Deal" shows
  "Booking coming soon", never a fake link.
- **No price alert notifications.** Alerts are stored in `price_alerts`
  but nothing checks fares against them yet — no scheduled job/worker is
  implemented (per the brief, this was intentionally deferred; the schema
  is ready for one — see `docs/architecture.md`).
- **In-memory cache & rate limiter.** Both are per-instance
  (`src/lib/cache.ts`, `src/lib/rate-limit.ts`) — fine for a single-instance
  MVP deployment, not a substitute for Redis/Upstash + an edge rate limiter
  at real scale.
- **Airport autocomplete is search-as-you-type but not a full airport
  database.** "From"/"To" (`src/components/AirportCombobox.tsx`) filter a
  curated list (`src/lib/airports.ts`, `src/lib/destinations.ts`), not every
  airport in the world.
- **Currency is preserved, not converted.** Prices are always shown in
  whatever `total_currency` Duffel returns for that offer (e.g. `AUD $289`,
  `USD $190`), never silently assumed to be AUD or converted — see
  `src/lib/format.ts`'s `formatPrice()`. No FX conversion is implemented.
- **No real flexible-date × Anywhere combination yet.** `/flexible-dates`
  checks a bounded spread of dates for one specific route; checking every
  date across every Anywhere destination at once needs a background job to
  stay within API-cost bounds — see `docs/product-roadmap.md`.

## Further documentation

- [`docs/architecture.md`](docs/architecture.md) — layers, caching, and key
  design decisions.
- [`docs/duffel-integration.md`](docs/duffel-integration.md) — exactly which
  Duffel endpoints/fields this app uses.
- [`docs/deployment.md`](docs/deployment.md) — deploying to Vercel.
- [`docs/revenue.md`](docs/revenue.md) — the booking/monetization
  architecture and what's required before it can go live.
- [`docs/seo.md`](docs/seo.md) — which pages are indexed and why, and
  structured data.
- [`docs/product-roadmap.md`](docs/product-roadmap.md) — MVP/V2/V3 scope and
  what's explicitly not built yet.
