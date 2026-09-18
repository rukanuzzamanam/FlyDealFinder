import { buildSearchCacheKey, flightSearchCache } from "./cache";
import { getFlightProvider } from "./flight-providers";
import { searchAnywhere } from "./anywhere-search";
import type { AnywhereSearchResult } from "./types";

const DEALS_CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Backs `/deals` and `/explore`: the full (bounded) Anywhere search across
 * all active destinations, cached — unlike `getHomepageDeals`, which only
 * checks a small curated subset for the homepage teaser.
 */
export async function getDeals(
  origin: string,
  departureDate: string,
  returnDate: string
): Promise<AnywhereSearchResult> {
  const cacheKey = buildSearchCacheKey({ scope: "deals-page", origin, departureDate, returnDate });
  const cached = flightSearchCache.get(cacheKey) as AnywhereSearchResult | undefined;
  if (cached) return cached;

  let provider;
  try {
    provider = getFlightProvider();
  } catch {
    return { origin, deals: [], searchedAt: new Date().toISOString() };
  }

  const result = await searchAnywhere(provider, {
    origin,
    departureDate,
    returnDate,
    passengers: { adults: 1, children: 0 },
  });

  flightSearchCache.set(cacheKey, result, DEALS_CACHE_TTL_MS);
  return result;
}
