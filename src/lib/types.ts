/**
 * Core domain types shared across the app. Kept independent of any specific
 * flight provider (Duffel, etc.) so the UI and API routes never depend on
 * provider-specific shapes.
 */

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface PassengerCounts {
  adults: number;
  children: number;
}

export interface FlightSearchParams {
  origin: string;
  /** IATA code, or "ANYWHERE" to trigger a multi-destination search. */
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD, omit for one-way
  passengers: PassengerCounts;
  cabinClass?: CabinClass;
  maxPrice?: number;
}

export interface FlightResult {
  id: string;
  airline: string;
  airlineCode?: string;
  airlineLogoUrl?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  /** Human readable, e.g. "6h 15m" */
  duration: string;
  /** Total minutes, used for sorting. */
  durationMinutes: number;
  stops: number;
  price: number;
  currency: string;
  bookingUrl?: string | null;
  /** ISO timestamp; offers expire and should not be trusted after this. */
  expiresAt?: string;
}

export interface FlightSearchResult {
  results: FlightResult[];
  /** True if the provider returned no usable offers (as opposed to an error). */
  isEmpty: boolean;
  provider: string;
  searchedAt: string;
}

export interface DestinationDeal {
  destination: Destination;
  cheapestPrice: number | null;
  currency: string | null;
  sampleFlight: FlightResult | null;
  error?: string;
}

export interface AnywhereSearchResult {
  origin: string;
  deals: DestinationDeal[];
  searchedAt: string;
}

export type DestinationRegion =
  | "Australia"
  | "Asia"
  | "New Zealand"
  | "Middle East"
  | "Europe"
  | "North America";

export interface Destination {
  id: string;
  city: string;
  country: string;
  airportCode: string;
  airportName: string;
  region: DestinationRegion;
  emoji?: string;
  active: boolean;
}
