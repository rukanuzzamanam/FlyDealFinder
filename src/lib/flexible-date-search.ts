import { buildSearchCacheKey } from "./cache";
import { mapWithConcurrency, withTimeout } from "./concurrency";
import type { FlightProvider, FlightProviderError } from "./flight-providers";
import type { CabinClass, DestinationDeal, PassengerCounts } from "./types";

const PER_DATE_TIMEOUT_MS = 18_000;
const FLEXIBLE_DATE_CONCURRENCY = 3;

/**
 * How many candidate departure dates a flexible-date search checks, and how
 * many days apart they are. 6 dates spread 5 days apart covers ~a month
 * while keeping this to a bounded, small number of live provider calls per
 * search (never "every day in the month") — see AGENTS.md's "no hundreds of
 * uncontrolled API calls" requirement.
 */
export const FLEXIBLE_DATE_CANDIDATE_COUNT = 6;
export const FLEXIBLE_DATE_STEP_DAYS = 5;

export interface FlexibleDateSearchOptions {
  origin: string;
  /** A specific destination airport code — Anywhere x flexible-dates
   * (checking every destination across every date) is out of scope for this
   * search; see docs/product-roadmap.md. */
  destination: string;
  /** First candidate departure date, YYYY-MM-DD. */
  monthStart: string;
  tripDurationDays: number;
  passengers: PassengerCounts;
  cabinClass?: CabinClass;
}

export interface FlexibleDateOption {
  departureDate: string;
  returnDate: string;
  cheapestPrice: number | null;
  currency: string | null;
  sampleFlight: DestinationDeal["sampleFlight"];
  error?: string;
}

export interface FlexibleDateSearchResult {
  origin: string;
  destination: string;
  tripDurationDays: number;
  options: FlexibleDateOption[];
  searchedAt: string;
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function candidateDepartureDates(monthStart: string): string[] {
  return Array.from({ length: FLEXIBLE_DATE_CANDIDATE_COUNT }, (_, i) =>
    addDays(monthStart, i * FLEXIBLE_DATE_STEP_DAYS)
  );
}

/**
 * Searches a bounded set of candidate departure dates for one route and
 * returns the cheapest fare found for each — the real implementation behind
 * "find the cheapest dates" (previously an unimplemented homepage claim; see
 * docs/product-roadmap.md for why this doesn't yet cover Anywhere + flexible
 * dates together).
 */
export async function searchFlexibleDates(
  provider: FlightProvider,
  options: FlexibleDateSearchOptions
): Promise<FlexibleDateSearchResult> {
  const departureDates = candidateDepartureDates(options.monthStart);

  const results = await mapWithConcurrency(departureDates, FLEXIBLE_DATE_CONCURRENCY, (departureDate) =>
    searchOneDate(provider, departureDate, options)
  );

  const sorted = [...results].sort((a, b) => {
    if (a.cheapestPrice == null) return 1;
    if (b.cheapestPrice == null) return -1;
    return a.cheapestPrice - b.cheapestPrice;
  });

  return {
    origin: options.origin,
    destination: options.destination,
    tripDurationDays: options.tripDurationDays,
    options: sorted,
    searchedAt: new Date().toISOString(),
  };
}

async function searchOneDate(
  provider: FlightProvider,
  departureDate: string,
  options: FlexibleDateSearchOptions
): Promise<FlexibleDateOption> {
  const returnDate = addDays(departureDate, options.tripDurationDays);
  try {
    const result = await withTimeout(
      provider.searchFlights({
        origin: options.origin,
        destination: options.destination,
        departureDate,
        returnDate,
        passengers: options.passengers,
        cabinClass: options.cabinClass,
      }),
      PER_DATE_TIMEOUT_MS,
      () => new Error(`Timed out searching ${departureDate}`)
    );

    if (result.isEmpty) {
      return { departureDate, returnDate, cheapestPrice: null, currency: null, sampleFlight: null };
    }

    const cheapest = result.results.reduce((min, r) => (r.price < min.price ? r : min));
    return {
      departureDate,
      returnDate,
      cheapestPrice: cheapest.price,
      currency: cheapest.currency,
      sampleFlight: cheapest,
    };
  } catch (err) {
    const message = (err as FlightProviderError)?.message ?? "Search failed";
    return { departureDate, returnDate, cheapestPrice: null, currency: null, sampleFlight: null, error: message };
  }
}

export interface FlexibleDateCacheKeyParams {
  origin: string;
  destination: string;
  monthStart: string;
  tripDurationDays: number;
  adults: number;
  children: number;
  cabinClass?: CabinClass;
}

export function buildFlexibleDateCacheKey(params: FlexibleDateCacheKeyParams): string {
  return buildSearchCacheKey({
    scope: "flexible-dates",
    origin: params.origin,
    destination: params.destination,
    monthStart: params.monthStart,
    tripDurationDays: params.tripDurationDays,
    adults: params.adults,
    children: params.children,
    cabinClass: params.cabinClass,
  });
}
