import { buildSearchCacheKey, flightSearchCache } from "./cache";
import { getFlightProvider } from "./flight-providers";
import type { FlightResult } from "./types";

const ROUTE_SAMPLE_CACHE_TTL_MS = 30 * 60 * 1000;

export interface RouteSample {
  cheapest: FlightResult | null;
  directAvailable: boolean;
  airlines: string[];
  /** When this sample was actually fetched — shown as "Checked X ago" so a
   * cached (up to 30 min old) sample is never implied to be live. */
  checkedAt: string;
}

/**
 * Backs the SEO route landing pages (`/sydney-to-bali-flights` etc.) — a
 * single recently-checked (cached up to 30 min) search used to derive real
 * "typical duration", "direct available", and "airlines serving this route"
 * facts, so those pages never state invented information (brief section 16).
 */
export async function getRouteSample(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): Promise<RouteSample> {
  const cacheKey = buildSearchCacheKey({
    scope: "route-info",
    origin,
    destination,
    departureDate,
    returnDate,
  });
  const cached = flightSearchCache.get(cacheKey) as RouteSample | undefined;
  if (cached) return cached;

  let sample: RouteSample = {
    cheapest: null,
    directAvailable: false,
    airlines: [],
    checkedAt: new Date().toISOString(),
  };
  try {
    const provider = getFlightProvider();
    const result = await provider.searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers: { adults: 1, children: 0 },
    });
    if (!result.isEmpty) {
      const cheapest = result.results.reduce((min, r) => (r.price < min.price ? r : min));
      const airlines = Array.from(new Set(result.results.map((r) => r.airline)));
      sample = {
        cheapest,
        directAvailable: result.results.some((r) => r.stops === 0),
        airlines,
        checkedAt: new Date().toISOString(),
      };
    }
  } catch {
    // Leave sample empty — the page still renders with honest "not
    // available right now" copy instead of throwing.
  }

  flightSearchCache.set(cacheKey, sample, ROUTE_SAMPLE_CACHE_TTL_MS);
  return sample;
}
