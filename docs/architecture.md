# Architecture

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│ UI (src/app, src/components) — client components for         │
│ interactive search/results, server components for the        │
│ homepage deals section and SEO metadata                       │
└───────────────────────────────┬───────────────────────────────┘
                                 │ fetch()
┌───────────────────────────────▼───────────────────────────────┐
│ API routes (src/app/api/**)                                   │
│  - Zod validation (src/lib/validation.ts)                     │
│  - Rate limiting (src/lib/rate-limit.ts)                      │
│  - Response caching (src/lib/cache.ts)                        │
│  - Never return raw provider responses — always FlightResult  │
└───────────────────────────────┬───────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────┐
│ Domain logic (src/lib)                                        │
│  - anywhere-search.ts — bounded-concurrency fan-out search     │
│  - sort-filter.ts — pure sort/filter functions over results    │
│  - homepage-deals.ts — curated small search for the homepage   │
└───────────────────────────────┬───────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────┐
│ FlightProvider interface (src/lib/flight-providers/types.ts)  │
│  DuffelFlightProvider is the only implementation today         │
└───────────────────────────────┬───────────────────────────────┘
                                 │ HTTPS
┌───────────────────────────────▼───────────────────────────────┐
│ Duffel API (api.duffel.com)                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Persistence (src/lib/db/*) — optional, Supabase/Postgres      │
│  users · destinations · searches · price_alerts               │
│  Falls back to a static in-repo destination list and           │
│  disabled price alerts when not configured.                    │
└─────────────────────────────────────────────────────────────┘
```

## Key design decisions

### The `FlightProvider` boundary

Nothing outside `src/lib/flight-providers/` knows Duffel exists. API routes
and UI components only see the app's own `FlightResult` /
`FlightSearchResult` types (`src/lib/types.ts`). This is what the brief
calls out explicitly in section 7/18 — it means a second provider (or an
aggregator that fans out to several and merges results) can be added by
implementing `FlightProvider` and switching `getFlightProvider()`, with
zero changes to routes or UI.

### Normalization happens once, at the provider boundary

`DuffelFlightProvider.searchFlights()` is the only place Duffel's response
shape (`duffel-types.ts`) is touched. Stops are derived from
`slice.segments.length - 1` (see `docs/duffel-integration.md` for why),
duration is parsed from ISO 8601, and price is parsed once. If Duffel
changes a field name, exactly one file needs to change.

### Anywhere search: bounded concurrency, per-destination isolation

`searchAnywhere()` (`src/lib/anywhere-search.ts`) uses
`mapWithConcurrency()` (`src/lib/concurrency.ts`) to cap simultaneous
Duffel calls (`ANYWHERE_SEARCH_CONCURRENCY`, default 4) against a bounded
destination batch (`ANYWHERE_SEARCH_BATCH_LIMIT`, default 16). Each
destination search is wrapped individually in a timeout and a try/catch —
one slow or failing destination never fails the whole Anywhere search, it
just shows as "no fares found" for that card.

### Caching

Two independent, intentionally simple caching layers:

- `src/lib/cache.ts` — an in-memory TTL cache keyed by search parameters,
  used by the API routes (`/api/flights/search`, `/api/flights/anywhere`)
  and `homepage-deals.ts`. Per-process only; good enough to avoid
  duplicate Duffel calls within a warm serverless instance, not a
  cross-instance cache.
- The homepage (`src/app/page.tsx`) uses Next's ISR (`export const
  revalidate = 1800`) so the "Cheap Flights From Sydney" section is
  prerendered and refreshed every 30 minutes in the background, rather
  than calling Duffel on every visit or freezing a price forever at build
  time.

Both are explicitly called out in code comments as the first things to
replace (e.g. with Upstash/Redis) if this needs to run across multiple
instances.

### Rate limiting

`src/lib/rate-limit.ts` is a fixed-window, in-memory limiter applied per
client IP in each API route. Same caveat as the cache: per-instance, a
blunt instrument appropriate for an MVP, not a production-scale guarantee.
Swap for an edge/infra-level limiter (Vercel Firewall, Upstash Ratelimit)
before scaling traffic.

### Database is optional everywhere it's used

`src/lib/db/supabase.ts` returns `null` when `SUPABASE_URL`/
`SUPABASE_SERVICE_ROLE_KEY` aren't set, and every caller
(`getActiveDestinations`, `createPriceAlert`, `logSearch`) has an explicit
fallback path:

- `getActiveDestinations()` → falls back to the static
  `DEFAULT_DESTINATIONS` list.
- `createPriceAlert()` → throws `DatabaseNotConfiguredError`, which the
  `/api/alerts` route turns into a 503 with a friendly message.
- `logSearch()` → silently no-ops (search logging must never break a
  user's search).

This lets the app run — and its tests pass — with zero external services
configured.

### Server/client secret boundary

- `DUFFEL_API_TOKEN` is read only inside `src/lib/flight-providers/duffel.ts`
  and `index.ts`, both invoked only from API route handlers (server-side).
- `SUPABASE_SERVICE_ROLE_KEY` is read only inside `src/lib/db/supabase.ts`,
  which imports the `server-only` package — importing it from a client
  component is a build-time error, not just a convention.
- Only `NEXT_PUBLIC_SITE_URL` is intentionally exposed to the client.

## Extensibility hooks left in place (see brief section 28)

- **Flexible dates / price history** — `FlightResult`/`DestinationDeal`
  don't currently carry historical price data, but `searches` (logged on
  every search) is the natural table to aggregate "average price" /
  "lowest observed price" from once that's built.
- **Scheduled price-alert checking** — `price_alerts` rows are inert today.
  A scheduled job (Vercel Cron, or any worker) can poll active alerts,
  call `getFlightProvider().searchFlights()` for each, and email when a
  fare drops below `target_price`.
- **Multiple providers** — see "The `FlightProvider` boundary" above.
- **SEO landing pages** — `src/app/sitemap.ts` is a short static list by
  design; add routes like `/cheap-flights-from-sydney` as real pages (not
  generated in bulk) and append them to the sitemap array.
