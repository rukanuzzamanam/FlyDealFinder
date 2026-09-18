/**
 * Minimal typings for the subset of the Duffel API response shape this app
 * consumes. Not an exhaustive SDK — only fields we actually read.
 *
 * Source of truth: https://duffel.com/docs/api (Offer Requests / Offers).
 */

export interface DuffelAirport {
  iata_code: string | null;
  name: string | null;
  city_name?: string | null;
}

export interface DuffelCarrier {
  name: string | null;
  iata_code: string | null;
  logo_symbol_url?: string | null;
  logo_lockup_url?: string | null;
}

export interface DuffelSegment {
  id: string;
  departing_at: string;
  arriving_at: string;
  duration: string | null;
  origin: DuffelAirport;
  destination: DuffelAirport;
  marketing_carrier: DuffelCarrier | null;
  operating_carrier?: DuffelCarrier | null;
}

export interface DuffelSlice {
  id: string;
  duration: string | null;
  origin: DuffelAirport;
  destination: DuffelAirport;
  segments: DuffelSegment[];
}

export interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  live_mode: boolean;
  expires_at: string | null;
  owner: DuffelCarrier & { id?: string };
  slices: DuffelSlice[];
}

export interface DuffelOfferRequest {
  id: string;
  created_at: string;
  live_mode: boolean;
  offers: DuffelOffer[];
}

export interface DuffelErrorBody {
  errors?: Array<{
    type?: string;
    title?: string;
    message?: string;
    code?: string;
  }>;
  meta?: { request_id?: string };
}

export interface DuffelEnvelope<T> {
  data: T;
}
