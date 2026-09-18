/** Adds `days` to today (UTC) and returns an ISO "YYYY-MM-DD" date string. */
export function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The fixed departure/return window used for the homepage, /deals,
 * /explore, and route-page sample searches: a ~1-week trip starting ~30
 * days out. This is a single snapshot search, not a live/rolling "today"
 * window or a range the visitor picked — copy referencing these results
 * must say so (e.g. "for a 7-night trip departing ~30 days out"), never
 * "today's deals" or "live prices". See docs/product-roadmap.md for the
 * real deal-engine work this stands in for.
 */
export const DEFAULT_SEARCH_DEPARTURE_OFFSET_DAYS = 30;
export const DEFAULT_SEARCH_TRIP_LENGTH_DAYS = 7;

export interface DefaultSearchWindow {
  departureDate: string;
  returnDate: string;
}

export function defaultSearchWindow(): DefaultSearchWindow {
  return {
    departureDate: addDaysIso(DEFAULT_SEARCH_DEPARTURE_OFFSET_DAYS),
    returnDate: addDaysIso(DEFAULT_SEARCH_DEPARTURE_OFFSET_DAYS + DEFAULT_SEARCH_TRIP_LENGTH_DAYS),
  };
}
