import type { Destination } from "./types";

/**
 * Seed/default destination list for "Anywhere" search.
 *
 * This is the static fallback used when no database is configured. When
 * `DATABASE_URL`/Supabase credentials are present, `getActiveDestinations()`
 * (see `src/lib/db/destinations.ts`) reads from the `destinations` table
 * instead, which is seeded from this same list (see
 * `supabase/migrations/0002_seed_destinations.sql`).
 *
 * To add a destination: append an entry here AND to the seed migration (or,
 * once a database is connected, insert a row via the admin screen / SQL).
 */
export const DEFAULT_DESTINATIONS: Destination[] = [
  // Australia
  d("mel", "Melbourne", "Australia", "MEL", "Melbourne Airport", "Australia", "🏙️"),
  d("bne", "Brisbane", "Australia", "BNE", "Brisbane Airport", "Australia", "🌇"),
  d("ool", "Gold Coast", "Australia", "OOL", "Gold Coast Airport", "Australia", "🏖️"),
  d("cns", "Cairns", "Australia", "CNS", "Cairns Airport", "Australia", "🐠"),
  d("per", "Perth", "Australia", "PER", "Perth Airport", "Australia", "🌅"),
  d("ade", "Adelaide", "Australia", "ADL", "Adelaide Airport", "Australia", "🍷"),
  d("hba", "Hobart", "Australia", "HBA", "Hobart Airport", "Australia", "🏔️"),

  // Asia
  d("dps", "Bali", "Indonesia", "DPS", "Ngurah Rai International Airport", "Asia", "🌴"),
  d("cgk", "Jakarta", "Indonesia", "CGK", "Soekarno–Hatta International Airport", "Asia", "🏙️"),
  d("bkk", "Bangkok", "Thailand", "BKK", "Suvarnabhumi Airport", "Asia", "🛕"),
  d("hkt", "Phuket", "Thailand", "HKT", "Phuket International Airport", "Asia", "🏝️"),
  d("kul", "Kuala Lumpur", "Malaysia", "KUL", "Kuala Lumpur International Airport", "Asia", "🕌"),
  d("sin", "Singapore", "Singapore", "SIN", "Singapore Changi Airport", "Asia", "🦁"),
  d("mnl", "Manila", "Philippines", "MNL", "Ninoy Aquino International Airport", "Asia", "🏝️"),
  d("sgn", "Ho Chi Minh City", "Vietnam", "SGN", "Tan Son Nhat International Airport", "Asia", "🛵"),
  d("han", "Hanoi", "Vietnam", "HAN", "Noi Bai International Airport", "Asia", "🏮"),
  d("nrt", "Tokyo", "Japan", "NRT", "Narita International Airport", "Asia", "🗼"),
  d("kix", "Osaka", "Japan", "KIX", "Kansai International Airport", "Asia", "🍥"),
  d("icn", "Seoul", "South Korea", "ICN", "Incheon International Airport", "Asia", "🏯"),
  d("tpe", "Taipei", "Taiwan", "TPE", "Taiwan Taoyuan International Airport", "Asia", "🥟"),
  d("hkg", "Hong Kong", "Hong Kong", "HKG", "Hong Kong International Airport", "Asia", "🌃"),

  // New Zealand
  d("akl", "Auckland", "New Zealand", "AKL", "Auckland Airport", "New Zealand", "⛵"),
  d("chc", "Christchurch", "New Zealand", "CHC", "Christchurch Airport", "New Zealand", "🏔️"),
  d("zqn", "Queenstown", "New Zealand", "ZQN", "Queenstown Airport", "New Zealand", "🏂"),
  d("wlg", "Wellington", "New Zealand", "WLG", "Wellington Airport", "New Zealand", "🌬️"),

  // Middle East
  d("dxb", "Dubai", "United Arab Emirates", "DXB", "Dubai International Airport", "Middle East", "🕌"),
  d("doh", "Doha", "Qatar", "DOH", "Hamad International Airport", "Middle East", "🏜️"),
  d("auh", "Abu Dhabi", "United Arab Emirates", "AUH", "Zayed International Airport", "Middle East", "🏙️"),

  // Europe
  d("lon", "London", "United Kingdom", "LON", "London (all airports)", "Europe", "🇬🇧"),
  d("par", "Paris", "France", "PAR", "Paris (all airports)", "Europe", "🗼"),
  d("rom", "Rome", "Italy", "ROM", "Rome (all airports)", "Europe", "🏛️"),
  d("ams", "Amsterdam", "Netherlands", "AMS", "Amsterdam Airport Schiphol", "Europe", "🌷"),
  d("fra", "Frankfurt", "Germany", "FRA", "Frankfurt Airport", "Europe", "🍺"),
  d("ist", "Istanbul", "Turkey", "IST", "Istanbul Airport", "Europe", "🕌"),

  // North America
  d("lax", "Los Angeles", "United States", "LAX", "Los Angeles International Airport", "North America", "🌴"),
  d("sfo", "San Francisco", "United States", "SFO", "San Francisco International Airport", "North America", "🌉"),
  d("nyc", "New York", "United States", "NYC", "New York (all airports)", "North America", "🗽"),
  d("yvr", "Vancouver", "Canada", "YVR", "Vancouver International Airport", "North America", "🍁"),
  d("hnl", "Honolulu", "United States", "HNL", "Daniel K. Inouye International Airport", "North America", "🌺"),
];

function d(
  id: string,
  city: string,
  country: string,
  airportCode: string,
  airportName: string,
  region: Destination["region"],
  emoji: string
): Destination {
  return { id, city, country, airportCode, airportName, region, emoji, active: true };
}

/**
 * Maximum number of destinations searched in a single "Anywhere" request.
 * Keeps concurrent Duffel calls bounded; raise once caching/queueing is in
 * place for larger fan-out.
 */
export const ANYWHERE_SEARCH_BATCH_LIMIT = 16;

/** How many destination searches run concurrently against the provider. */
export const ANYWHERE_SEARCH_CONCURRENCY = 4;
