# Duffel integration notes

This app's only flight data source is [Duffel](https://duffel.com/docs/api).
This doc records exactly which parts of the Duffel API are used, so that
future changes can be checked against Duffel's current docs rather than
against assumptions baked into the code.

Primary references used while building this integration:

- https://duffel.com/docs/api/overview/making-requests — auth headers
- https://duffel.com/docs/api/offer-requests/create-offer-request —
  request/response envelope for `POST /air/offer_requests`
- https://duffel.com/docs/api/offer-requests/schema — request body fields
- https://duffel.com/docs/api/offers/schema — offer/slice/segment fields
- https://duffel.com/docs/api/orders/schema — order creation (booking)

**Before changing `src/lib/flight-providers/duffel.ts` or
`duffel-types.ts`, re-check these pages** — Duffel versions its API via the
`Duffel-Version` header, and fields can change between versions.

## Authentication

Every request sends:

```
Authorization: Bearer <DUFFEL_API_TOKEN>
Duffel-Version: v2
Content-Type: application/json
Accept: application/json
```

`DUFFEL_API_TOKEN` is read server-side only
(`src/lib/flight-providers/index.ts`). Use a **test-mode** token
(from https://app.duffel.com, Developers → Access tokens) during
development — it returns synthetic but realistic offers without touching
real airline inventory.

## Searching for flights

`DuffelFlightProvider.searchFlights()` calls:

```
POST https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=15000
```

Body (wrapped in a top-level `data` key, per Duffel's convention):

```json
{
  "data": {
    "slices": [
      { "origin": "SYD", "destination": "DPS", "departure_date": "2026-10-12" }
    ],
    "passengers": [{ "type": "adult" }],
    "cabin_class": "economy"
  }
}
```

- **One-way** search → a single slice.
- **Return** search → a second slice with origin/destination swapped and
  `departure_date` set to the return date. Duffel doesn't have a separate
  "return date" concept — a round trip is just a two-slice request, and
  offers come back covering both slices together.
- **Passengers** → one entry per adult (`{ "type": "adult" }`) and one per
  child (`{ "type": "child" }`). Duffel's schema allows `type` **or** `age`
  per passenger; this app only sends `type`, which is enough for standard
  fare search. If child/infant fare accuracy becomes important, switch to
  sending `age` instead once the UI collects ages.
- `return_offers=true` means offers come back embedded in the same
  response — no second request to fetch offers separately.
- `supplier_timeout` (query param, ms) is how long Duffel waits on
  individual airlines; this app also enforces its own client-side abort
  (`CLIENT_TIMEOUT_MS`, 20s) in case Duffel itself is slow to respond.

## Normalizing the response

Duffel's response is `{ data: { id, offers: [...] } }`. Each offer maps to
one `FlightResult` (`src/lib/types.ts`) via `normalizeOffer()`:

| `FlightResult` field | Duffel source |
|---|---|
| `airline` / `airlineCode` / `airlineLogoUrl` | `offer.owner.{name,iata_code,logo_symbol_url}` |
| `origin` / `destination` | `offer.slices[0].origin/destination.iata_code` (outbound slice) |
| `departureTime` / `arrivalTime` | first/last segment of `offer.slices[0]` — `departing_at`/`arriving_at` |
| `returnDepartureTime` / `returnArrivalTime` | first/last segment of `offer.slices[1]` (return leg, if present) |
| `duration` / `durationMinutes` | `offer.slices[0].duration` (ISO 8601, e.g. `PT6H15M`), parsed by `src/lib/format.ts` |
| `stops` | `offer.slices[0].segments.length - 1` |
| `price` / `currency` | `offer.total_amount` (parsed as a float) / `offer.total_currency` |
| `bookingUrl` | always `null` — see below |
| `expiresAt` | `offer.expires_at` |

**Why `stops = segments.length - 1`, not the segment-level `stops` array:**
Duffel's segment object has its own `stops` array for *technical* stops on
a single flight number (e.g. a refuelling stop where you don't change
planes). What users mean by "1 stop" is a *connection* — a change between
segments — so this app counts slice segments instead. This matches the
"Direct" / "1 stop" language in the product brief's example flight card.

## Errors

Duffel returns `{ errors: [{ message, ... }] }` on failure. `duffel.ts`
maps HTTP status → `FlightProviderError` code:

| Duffel status | `FlightProviderError.code` | User-facing message |
|---|---|---|
| 429 | `RATE_LIMITED` | "Flight search is temporarily busy…" |
| 400 / 422 | `INVALID_REQUEST` | Duffel's own message (e.g. bad airport code) |
| network timeout (client-side abort) | `UPSTREAM_TIMEOUT` | "The search is taking longer than expected…" |
| anything else non-2xx | `UPSTREAM_ERROR` | "We couldn't find flights for those dates…" |
| `DUFFEL_API_TOKEN` unset | `CONFIG_ERROR` | "Flight search is currently unavailable." |

API routes never forward Duffel's raw error body or the access token to
the client — see `handleSearchError()` in
`src/app/api/flights/search/route.ts`.

## Booking — intentionally not implemented

Duffel has **no booking deep-link or affiliate URL** field on an offer.
Completing a purchase means creating an **Order**
(`POST /air/orders`) with the offer ID, passenger details, and payment
information — a materially different (and higher-stakes: it moves real
money and books real seats) feature than search.

This MVP's `getBookingUrl()` (in `duffel.ts`) returns `null` for every
result, and the UI shows "Booking coming soon" instead of a broken/fake
"View Deal" link when that's the case. To add real booking:

1. Implement order creation server-side (`POST /air/orders`), including
   Duffel's payment flow (this involves PCI-relevant card handling —
   follow Duffel's current payments docs closely).
2. Either redirect to an internal `/book/[offerId]` checkout page, or, if
   Duffel later offers a hosted checkout / deep-link product, use that
   according to its docs instead of building a custom one.
3. Remember offers expire (`expires_at`) — an order attempt against an
   expired offer will fail and needs a "price changed, search again"
   fallback in the UI.
