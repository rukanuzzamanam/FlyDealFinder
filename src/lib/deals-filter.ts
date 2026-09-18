import type { DestinationDeal, DestinationRegion } from "./types";

export interface DealsFilters {
  region?: DestinationRegion;
  maxPrice?: number;
  directOnly?: boolean;
}

/** Pure client-side filtering over an already-fetched deals list — no new
 * provider calls, so it composes freely with the origin/date fetch in
 * `DestinationExplorer`. */
export function filterDeals(deals: DestinationDeal[], filters: DealsFilters): DestinationDeal[] {
  return deals.filter((deal) => {
    if (filters.region && deal.destination.region !== filters.region) return false;

    if (filters.maxPrice != null) {
      if (deal.cheapestPrice == null || deal.cheapestPrice > filters.maxPrice) return false;
    }

    if (filters.directOnly) {
      if (!deal.sampleFlight || deal.sampleFlight.stops > 0) return false;
    }

    return true;
  });
}
