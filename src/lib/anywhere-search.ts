import { buildSearchCacheKey } from "./cache";
import { mapWithConcurrency, withTimeout } from "./concurrency";
import { ANYWHERE_SEARCH_BATCH_LIMIT, ANYWHERE_SEARCH_CONCURRENCY } from "./destinations";
import { getActiveDestinations } from "./db/destinations";
import type { FlightProvider, FlightProviderError } from "./flight-providers";
import type {
  AnywhereSearchResult,
  CabinClass,
  Destination,
  DestinationDeal,
  PassengerCounts,
} from "./types";

const PER_DESTINATION_TIMEOUT_MS = 18_000;

export interface AnywhereSearchOptions {
  origin: string;
  departureDate: string;
  returnDate?: string;
  passengers: PassengerCounts;
  maximumPrice?: number;
  cabinClass?: CabinClass;
}

/**
 * Every parameter that changes what an Anywhere search returns must be part
 * of its cache key — a search for a $300 budget and one for an $800 budget
 * (or economy vs. business) are different requests and must never share a
 * cached result. Exported so the API route and tests use the exact same key
 * shape (see anywhere-search.test.ts).
 */
export interface AnywhereCacheKeyParams {
  origin: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  maximumPrice?: number;
  cabinClass?: CabinClass;
}

export function buildAnywhereCacheKey(params: AnywhereCacheKeyParams): string {
  return buildSearchCacheKey({
    scope: "anywhere",
    origin: params.origin,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    adults: params.adults,
    children: params.children,
    maximumPrice: params.maximumPrice,
    cabinClass: params.cabinClass,
  });
}

/**
 * Searches a bounded, configurable batch of destinations concurrently and
 * returns the cheapest offer found for each. Individual destination
 * failures (timeout, no availability, provider error) are captured per-deal
 * rather than failing the whole request.
 */
export async function searchAnywhere(
  provider: FlightProvider,
  options: AnywhereSearchOptions
): Promise<AnywhereSearchResult> {
  const allDestinations = await getActiveDestinations();
  const candidates = allDestinations
    .filter((d) => d.airportCode !== options.origin)
    .slice(0, ANYWHERE_SEARCH_BATCH_LIMIT);

  const deals = await mapWithConcurrency(
    candidates,
    ANYWHERE_SEARCH_CONCURRENCY,
    (destination) => searchOneDestination(provider, destination, options)
  );

  const sorted = deals
    .filter((deal) => options.maximumPrice == null || deal.cheapestPrice == null || deal.cheapestPrice <= options.maximumPrice)
    .sort((a, b) => {
      if (a.cheapestPrice == null) return 1;
      if (b.cheapestPrice == null) return -1;
      return a.cheapestPrice - b.cheapestPrice;
    });

  return {
    origin: options.origin,
    deals: sorted,
    searchedAt: new Date().toISOString(),
  };
}

async function searchOneDestination(
  provider: FlightProvider,
  destination: Destination,
  options: AnywhereSearchOptions
): Promise<DestinationDeal> {
  try {
    const result = await withTimeout(
      provider.searchFlights({
        origin: options.origin,
        destination: destination.airportCode,
        departureDate: options.departureDate,
        returnDate: options.returnDate,
        passengers: options.passengers,
        cabinClass: options.cabinClass,
      }),
      PER_DESTINATION_TIMEOUT_MS,
      () => new Error(`Timed out searching ${destination.airportCode}`)
    );

    if (result.isEmpty) {
      return { destination, cheapestPrice: null, currency: null, sampleFlight: null };
    }

    const cheapest = result.results.reduce((min, r) => (r.price < min.price ? r : min));
    return {
      destination,
      cheapestPrice: cheapest.price,
      currency: cheapest.currency,
      sampleFlight: cheapest,
    };
  } catch (err) {
    const message = (err as FlightProviderError)?.message ?? "Search failed";
    return { destination, cheapestPrice: null, currency: null, sampleFlight: null, error: message };
  }
}
