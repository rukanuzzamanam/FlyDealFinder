import { DuffelFlightProvider } from "./duffel";
import { FlightProviderError } from "./types";
import type { FlightProvider } from "./types";

export type { FlightProvider } from "./types";
export { FlightProviderError } from "./types";

let cachedProvider: FlightProvider | null = null;

/**
 * Returns the active `FlightProvider`. Duffel is the only implementation
 * today; to add another provider, implement `FlightProvider` and select it
 * here (e.g. via a `FLIGHT_PROVIDER` env var).
 */
export function getFlightProvider(): FlightProvider {
  if (cachedProvider) return cachedProvider;

  const token = process.env.DUFFEL_API_TOKEN;
  if (!token) {
    throw new FlightProviderError(
      "DUFFEL_API_TOKEN is not set. Add it to .env.local (see .env.example).",
      "CONFIG_ERROR"
    );
  }

  cachedProvider = new DuffelFlightProvider(token);
  return cachedProvider;
}
