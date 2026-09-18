# Product roadmap

Maps the phases in AGENTS.md (sections 38–39) to this repo's actual state.

## MVP (done)

- Search — one-way/return, airport autocomplete, cabin class, budget.
- Anywhere search — bounded-concurrency fan-out, budget filter.
- Deals (`/deals`) and Explore (`/explore`) — live fares across the full
  destination list, filterable by region/price/direct-only.
- Booking/deal flow — `BookingProvider` abstraction with Duffel Links,
  gated behind commercial configuration (see `docs/revenue.md`); shows
  "Booking coming soon" honestly until that's live.
- Analytics — client-side event tracking (`src/lib/analytics.ts`), logged to
  console pending a real provider.
- SEO — `/cheap-flights-from-sydney` + 3 route pages, structured data,
  sitemap/robots (see `docs/seo.md`).
- Legal/trust pages — about, contact, privacy, terms, cookies, disclaimer,
  affiliate disclosure.

## V2 (next)

- **Price history** — persist `searches`/provider results over time
  (`price_history` table) to back the "price trend" placeholders already on
  route pages and replace the current "cheap because it's cheap" framing
  with a real deal-detection engine (historical average, % below average).
- **Price alerts** — a scheduled job (Vercel Cron or similar) polling active
  `price_alerts` rows and emailing via a real provider once one is chosen;
  today alerts are stored but never checked.
- **User accounts** — optional login so saved searches/alerts/preferences
  persist across devices, without gating basic search.
- **Newsletter sending** — today signups are stored (`newsletter_subscribers`)
  but nothing sends the actual weekly email yet.
- **More destinations & origins** — raise `ANYWHERE_SEARCH_BATCH_LIMIT` and
  add origin cities beyond Sydney, once caching/cost controls justify it.
- **Admin deal/revenue dashboard** — searches, bookings, revenue, top routes,
  API cost — the `/admin` page today only lists destinations/integration
  status.

## V3 (later)

- AI travel assistant / personalized recommendations.
- A second `FlightProvider` (the abstraction already supports this — see
  `docs/architecture.md`).
- Advanced deal detection using the price-history data from V2.
- Direct Duffel Orders integration as an alternative to Duffel Links, if a
  more custom checkout experience becomes worth the added PCI/compliance
  scope (see `docs/revenue.md`).
