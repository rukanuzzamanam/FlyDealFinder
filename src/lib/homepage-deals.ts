import { buildSearchCacheKey, flightSearchCache } from "./cache";
import { mapWithConcurrency, withTimeout } from "./concurrency";
import { DEFAULT_DESTINATIONS } from "./destinations";
import { getFlightProvider } from "./flight-providers";
import type { DestinationDeal } from "./types";

/** A small, curated subset of destinations shown on the homepage — kept
 * intentionally short so every homepage load doesn't fan out to the full
 * Anywhere destination list. */
const HOMEPAGE_DESTINATION_CODES = ["DPS", "NRT", "BKK", "AKL", "SIN", "DXB"];
const HOMEPAGE_SEARCH_TIMEOUT_MS = 12_000;
const HOMEPAGE_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Fetches real, live cheapest fares for the homepage "Cheap Flights From"
 * section. Never fabricates a price: if the provider isn't configured or a
 * destination search fails, that destination is simply omitted.
 */
export async function getHomepageDeals(
  origin: string,
  departureDate: string,
  returnDate: string
): Promise<DestinationDeal[]> {
  const cacheKey = buildSearchCacheKey({ scope: "homepage", origin, departureDate, returnDate });
  const cached = flightSearchCache.get(cacheKey) as DestinationDeal[] | undefined;
  if (cached) return cached;

  let provider;
  try {
    provider = getFlightProvider();
  } catch {
    return [];
  }

  const destinations = DEFAULT_DESTINATIONS.filter((d) =>
    HOMEPAGE_DESTINATION_CODES.includes(d.airportCode)
  );

  const deals = await mapWithConcurrency(destinations, 3, async (destination): Promise<DestinationDeal | null> => {
    try {
      const result = await withTimeout(
        provider.searchFlights({
          origin,
          destination: destination.airportCode,
          departureDate,
          returnDate,
          passengers: { adults: 1, children: 0 },
        }),
        HOMEPAGE_SEARCH_TIMEOUT_MS,
        () => new Error(`Timed out searching ${destination.airportCode}`)
      );
      if (result.isEmpty) return null;
      const cheapest = result.results.reduce((min, r) => (r.price < min.price ? r : min));
      return {
        destination,
        cheapestPrice: cheapest.price,
        currency: cheapest.currency,
        sampleFlight: cheapest,
      };
    } catch {
      return null;
    }
  });

  const filtered = deals
    .filter((d): d is DestinationDeal => d !== null)
    .sort((a, b) => (a.cheapestPrice ?? Infinity) - (b.cheapestPrice ?? Infinity));

  flightSearchCache.set(cacheKey, filtered, HOMEPAGE_CACHE_TTL_MS);
  return filtered;
}
