import { parseIsoDurationToMinutes, formatMinutes } from "../format";
import type { FlightResult, FlightSearchParams, FlightSearchResult } from "../types";
import { FlightProviderError } from "./types";
import type { FlightProvider } from "./types";
import type {
  DuffelEnvelope,
  DuffelErrorBody,
  DuffelOffer,
  DuffelOfferRequest,
} from "./duffel-types";

const DUFFEL_API_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

/** Supplier timeout passed to Duffel itself (ms), and our own hard client-side cutoff. */
const SUPPLIER_TIMEOUT_MS = 15_000;
const CLIENT_TIMEOUT_MS = 20_000;

/**
 * Duffel implementation of the generic `FlightProvider` interface.
 *
 * Docs: https://duffel.com/docs/api/overview/making-requests (auth/headers)
 *       https://duffel.com/docs/api/offer-requests/create-offer-request (request/response shape)
 *       https://duffel.com/docs/api/offers/schema (offer/slice/segment fields)
 *
 * Duffel has no booking deep-link/affiliate URL — completing a purchase
 * requires creating an Order via POST /air/orders with the offer id and
 * payment details. `bookingUrl` is therefore left null for now; see
 * `getBookingUrl()` below and docs/duffel-integration.md.
 */
export class DuffelFlightProvider implements FlightProvider {
  readonly name = "duffel";

  constructor(private readonly apiToken: string) {
    if (!apiToken) {
      throw new FlightProviderError(
        "Duffel API token is not configured",
        "CONFIG_ERROR"
      );
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    const body = {
      data: {
        slices: buildSlices(params),
        passengers: buildPassengers(params),
        cabin_class: params.cabinClass ?? "economy",
      },
    };

    const url = `${DUFFEL_API_BASE}/air/offer_requests?return_offers=true&supplier_timeout=${SUPPLIER_TIMEOUT_MS}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Duffel-Version": DUFFEL_VERSION,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new FlightProviderError(
          "Flight search timed out",
          "UPSTREAM_TIMEOUT",
          err
        );
      }
      throw new FlightProviderError(
        "Could not reach the flight search provider",
        "UPSTREAM_ERROR",
        err
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw await toProviderError(response);
    }

    const json = (await response.json()) as DuffelEnvelope<DuffelOfferRequest>;
    const offers = json.data.offers ?? [];
    const results = offers.map((offer) => normalizeOffer(offer)).filter(Boolean) as FlightResult[];

    return {
      results,
      isEmpty: results.length === 0,
      provider: this.name,
      searchedAt: new Date().toISOString(),
    };
  }
}

function buildSlices(params: FlightSearchParams) {
  const slices = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
    },
  ];
  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    });
  }
  return slices;
}

function buildPassengers(params: FlightSearchParams) {
  const passengers: Array<{ type: string }> = [];
  for (let i = 0; i < params.passengers.adults; i++) passengers.push({ type: "adult" });
  for (let i = 0; i < params.passengers.children; i++) passengers.push({ type: "child" });
  return passengers;
}

function normalizeOffer(offer: DuffelOffer): FlightResult | null {
  const outbound = offer.slices[0];
  const inbound = offer.slices[1];
  if (!outbound || outbound.segments.length === 0) return null;

  const firstSegment = outbound.segments[0];
  const lastSegment = outbound.segments[outbound.segments.length - 1];

  const inboundFirst = inbound?.segments[0];
  const inboundLast = inbound?.segments[inbound.segments.length - 1];

  const durationMinutes = outbound.duration
    ? parseIsoDurationToMinutes(outbound.duration)
    : sumSegmentMinutes(outbound);

  const price = Number.parseFloat(offer.total_amount);
  if (Number.isNaN(price)) return null;

  return {
    id: offer.id,
    // Same value as `id` today (Duffel offers have no separate "search
    // result" vs "offer" id), but kept as its own field so the booking flow
    // never has to assume `id` means "the provider's offer identifier" —
    // see the field's doc comment in src/lib/types.ts.
    providerOfferId: offer.id,
    airline: offer.owner.name ?? "Unknown airline",
    airlineCode: offer.owner.iata_code ?? undefined,
    airlineLogoUrl: offer.owner.logo_symbol_url ?? undefined,
    origin: outbound.origin.iata_code ?? firstSegment.origin.iata_code ?? "",
    destination: outbound.destination.iata_code ?? lastSegment.destination.iata_code ?? "",
    departureTime: firstSegment.departing_at,
    arrivalTime: lastSegment.arriving_at,
    returnDepartureTime: inboundFirst?.departing_at,
    returnArrivalTime: inboundLast?.arriving_at,
    duration: formatMinutes(durationMinutes),
    durationMinutes,
    stops: Math.max(0, outbound.segments.length - 1),
    price,
    currency: offer.total_currency,
    bookingUrl: getBookingUrl(),
    expiresAt: offer.expires_at ?? undefined,
  };
}

function sumSegmentMinutes(slice: DuffelOffer["slices"][number]): number {
  return slice.segments.reduce(
    (total, seg) => total + parseIsoDurationToMinutes(seg.duration),
    0
  );
}

/**
 * Duffel does not expose a booking/deep-link URL on the offer — purchase
 * requires creating an Order server-side (POST /air/orders). Returns null
 * until that order-creation flow (or an affiliate provider) is implemented.
 * See `docs/duffel-integration.md` and section 18 of the product brief.
 */
function getBookingUrl(): string | null {
  return null;
}

async function toProviderError(response: Response): Promise<FlightProviderError> {
  let body: DuffelErrorBody | null = null;
  try {
    body = (await response.json()) as DuffelErrorBody;
  } catch {
    // ignore parse failures, fall through to generic message
  }

  const firstError = body?.errors?.[0];

  if (response.status === 429) {
    return new FlightProviderError(
      "The flight search provider is rate limiting us",
      "RATE_LIMITED"
    );
  }
  if (response.status === 422 || response.status === 400) {
    return new FlightProviderError(
      firstError?.message ?? "Invalid flight search request",
      "INVALID_REQUEST"
    );
  }
  return new FlightProviderError(
    firstError?.message ?? `Flight search provider returned ${response.status}`,
    "UPSTREAM_ERROR"
  );
}
