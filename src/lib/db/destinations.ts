import "server-only";
import { DEFAULT_DESTINATIONS } from "../destinations";
import type { Destination } from "../types";
import { getSupabaseAdmin } from "./supabase";

interface DestinationRow {
  id: string;
  city: string;
  country: string;
  airport_code: string;
  airport_name: string;
  region: Destination["region"];
  emoji: string | null;
  active: boolean;
}

/**
 * Returns the active destination list for "Anywhere" search. Reads from the
 * `destinations` table when Supabase is configured (so destinations can be
 * managed without a redeploy), otherwise falls back to the static seed list
 * in `src/lib/destinations.ts`.
 */
export async function getActiveDestinations(): Promise<Destination[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return DEFAULT_DESTINATIONS.filter((d) => d.active);
  }

  const { data, error } = await supabase
    .from("destinations")
    .select("id, city, country, airport_code, airport_name, region, emoji, active")
    .eq("active", true);

  if (error || !data || data.length === 0) {
    return DEFAULT_DESTINATIONS.filter((d) => d.active);
  }

  return (data as DestinationRow[]).map((row) => ({
    id: row.id,
    city: row.city,
    country: row.country,
    airportCode: row.airport_code,
    airportName: row.airport_name,
    region: row.region,
    emoji: row.emoji ?? undefined,
    active: row.active,
  }));
}
