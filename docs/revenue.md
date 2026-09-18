# Revenue architecture

This documents the evaluation behind FlyDealFinder's first monetization path
and exactly what's required before it can go live — see also AGENTS.md
sections 2–3 and 23.

## Why Duffel Links, not a direct Orders/Payments integration

Two ways to let a user actually complete a booking were evaluated:

1. **Direct Duffel Orders API** (`POST /air/orders`) — we'd build our own
   checkout UI, collect passenger and payment details, and create the order
   ourselves. This is materially higher-stakes: it means handling
   PCI-relevant card data (even via Duffel's payment intents, we'd own the
   checkout flow and its correctness/compliance) and building fare
   re-validation, error handling for expired offers, and refund/failure
   flows ourselves.
2. **Duffel Links** — a Duffel-hosted, brandable checkout. We create a
   session server-side and redirect the user to it; Duffel handles search
   refinement, passenger details, and payment. Duffel Links supports a
   configurable markup (`markup_rate` / `markup_amount`) applied at session
   creation, which is our actual revenue mechanism.

References (fetched during this evaluation — re-check before changing the
implementation, since Duffel versions its API):
- https://duffel.com/docs/guides/duffel-links
- https://duffel.com/docs/guides/margin-and-markups

**Duffel Links was chosen** as the Phase 1 path: it gets to a real revenue
mechanism (markup on completed bookings) with no PCI scope on our side, at
the cost of a less custom checkout experience. Direct Orders integration
remains a valid future upgrade once there's a reason to fully own checkout
(e.g. a more integrated post-booking experience) — the `BookingProvider`
abstraction (`src/lib/booking-providers/`) exists specifically so that swap
doesn't touch the UI.

## What's required before this goes live

Duffel Links requires **an account approved for Duffel Payments in a
supported country** — a working `DUFFEL_API_TOKEN` (used for flight search)
does **not** by itself grant Links/Payments access. Before enabling live
bookings:

1. Apply for / confirm Duffel Payments approval for the FlyDealFinder
   account, in a Duffel-Payments-supported country.
2. Decide on a markup rate (industry benchmark from Duffel's docs: 2–6%) and
   set `BOOKING_MARKUP_RATE` (a decimal, e.g. `0.05` for 5%).
3. Set `DUFFEL_LINKS_ENABLED=true`.
4. Set `DUFFEL_LINKS_MODE=live` **only** once real payments are actually
   approved and tested — until then, leave it at the default `test`, which
   shows a "Test Booking" badge and never implies a real charge occurred.

Until all of the above are done, `getBookingProvider()`
(`src/lib/booking-providers/index.ts`) returns a provider that reports
`mode: "unavailable"`, and `FlightCard` shows "Booking coming soon" — never a
booking-looking link that isn't real (AGENTS.md section 3).

## How the pieces fit together

```
FlightCard (UI)
   │ GET /api/booking/status   — cheap, config-only mode check (once per page)
   │ POST /api/booking/session — creates a real session, only on click
   ▼
BookingProvider interface (src/lib/booking-providers/types.ts)
   │
   ▼
DuffelLinksBookingProvider — only implementation today
   │
   ▼
Duffel Links API (POST /links/sessions)
```

Nothing in the UI depends on Duffel Links directly — `FlightCard` and
`BookingButton` only see the generic `BookingSession { mode, url, provider }`
shape, the same pattern used for `FlightProvider` (see
docs/architecture.md).

## Known gaps to close before "live"

- The exact response shape of `POST /links/sessions` used in
  `duffel-links.ts` (`{ data: { url } }`) is based on Duffel's published
  guide, not a live sandbox call (Links wasn't enabled during this session) —
  verify against a real test-mode response before flipping
  `DUFFEL_LINKS_ENABLED=true`.
- `/booking/success` and `/booking/failed` exist as simple confirmation pages
  reading the `order_id`/`reference` query params, but there's no
  server-side verification that a redirect to `/booking/success` actually
  corresponds to a real completed order (e.g. via a Duffel webhook) — anyone
  could hit that URL directly. Fine for a page that just says "thanks", not
  fine as the source of truth for whether an order was paid; add webhook
  verification before that page (or anything downstream of it) is trusted
  for revenue reporting.
- No revenue/booking-attempt tracking in the admin dashboard yet (deferred to
  a later phase — see the product roadmap).
