import "server-only";
import { getSupabaseAdmin } from "./supabase";

export interface SearchLogEntry {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}

/**
 * Best-effort search logging for the `searches` table (used later for
 * analytics/popular-routes). Never throws — a logging failure must not
 * break a user's search.
 */
export async function logSearch(entry: SearchLogEntry): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from("searches").insert({
      origin: entry.origin,
      destination: entry.destination,
      departure_date: entry.departureDate,
      return_date: entry.returnDate ?? null,
      passengers: entry.passengers,
    });
  } catch {
    // Non-critical — swallow so search logging never breaks a user request.
  }
}
