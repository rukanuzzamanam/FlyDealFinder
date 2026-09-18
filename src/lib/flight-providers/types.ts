import type { FlightSearchParams, FlightSearchResult } from "../types";

/**
 * Provider-agnostic contract for flight search. The rest of the app (API
 * routes, UI) only ever talks to this interface, never to a specific
 * provider's SDK/response shape. To add a new provider (e.g. a second
 * aggregator), implement this interface and register it in
 * `src/lib/flight-providers/index.ts`.
 */
export interface FlightProvider {
  readonly name: string;
  searchFlights(params: FlightSearchParams): Promise<FlightSearchResult>;
}

export class FlightProviderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_REQUEST"
      | "UPSTREAM_TIMEOUT"
      | "RATE_LIMITED"
      | "UPSTREAM_ERROR"
      | "NO_RESULTS"
      | "CONFIG_ERROR",
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FlightProviderError";
  }
}
