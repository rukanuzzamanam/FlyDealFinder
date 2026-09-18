import type { FlightResult } from "./types";

export type SortOption = "cheapest" | "fastest" | "fewest_stops" | "departure_time";

export function sortResults(results: FlightResult[], sortBy: SortOption): FlightResult[] {
  const copy = [...results];
  switch (sortBy) {
    case "cheapest":
      return copy.sort((a, b) => a.price - b.price);
    case "fastest":
      return copy.sort((a, b) => a.durationMinutes - b.durationMinutes);
    case "fewest_stops":
      return copy.sort((a, b) => a.stops - b.stops || a.price - b.price);
    case "departure_time":
      return copy.sort(
        (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
    default:
      return copy;
  }
}

export type DepartureWindow = "morning" | "afternoon" | "evening" | "night";

export interface FlightFilters {
  minPrice?: number;
  maxPrice?: number;
  stops?: Array<0 | 1 | 2>; // 2 means "2+"
  airlineCodes?: string[];
  departureWindows?: DepartureWindow[];
}

/**
 * Buckets a departure time into a time-of-day window using the wall-clock
 * hour written in the ISO string itself (Duffel's `departing_at` is local
 * time at the departure airport, with its UTC offset attached). Parsing the
 * hour digits directly — rather than going through `Date`, which converts
 * to the *runtime's* timezone — keeps this both correct (local-to-airport)
 * and deterministic regardless of server timezone.
 */
export function getDepartureWindow(iso: string): DepartureWindow {
  const match = /T(\d{2}):/.exec(iso);
  const hour = match ? Number(match[1]) : new Date(iso).getUTCHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function filterResults(results: FlightResult[], filters: FlightFilters): FlightResult[] {
  return results.filter((r) => {
    if (filters.minPrice != null && r.price < filters.minPrice) return false;
    if (filters.maxPrice != null && r.price > filters.maxPrice) return false;

    if (filters.stops && filters.stops.length > 0) {
      const bucket = r.stops >= 2 ? 2 : r.stops;
      if (!filters.stops.includes(bucket as 0 | 1 | 2)) return false;
    }

    if (filters.airlineCodes && filters.airlineCodes.length > 0) {
      if (!r.airlineCode || !filters.airlineCodes.includes(r.airlineCode)) return false;
    }

    if (filters.departureWindows && filters.departureWindows.length > 0) {
      if (!filters.departureWindows.includes(getDepartureWindow(r.departureTime))) return false;
    }

    return true;
  });
}

export function getAvailableAirlines(
  results: FlightResult[]
): Array<{ code: string; name: string }> {
  const map = new Map<string, string>();
  for (const r of results) {
    if (r.airlineCode && !map.has(r.airlineCode)) map.set(r.airlineCode, r.airline);
  }
  return Array.from(map, ([code, name]) => ({ code, name })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
