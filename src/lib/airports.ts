/**
 * Popular departure airports offered in the "From" selector. Separate from
 * `destinations.ts` (the Anywhere-search target list) because an origin
 * like Sydney isn't itself a valid "Anywhere" destination.
 */
export interface Airport {
  code: string;
  city: string;
  country: string;
}

export const POPULAR_ORIGINS: Airport[] = [
  { code: "SYD", city: "Sydney", country: "Australia" },
  { code: "MEL", city: "Melbourne", country: "Australia" },
  { code: "BNE", city: "Brisbane", country: "Australia" },
  { code: "PER", city: "Perth", country: "Australia" },
  { code: "ADL", city: "Adelaide", country: "Australia" },
  { code: "OOL", city: "Gold Coast", country: "Australia" },
  { code: "CNS", city: "Cairns", country: "Australia" },
  { code: "AKL", city: "Auckland", country: "New Zealand" },
  { code: "SIN", city: "Singapore", country: "Singapore" },
  { code: "LON", city: "London", country: "United Kingdom" },
  { code: "LAX", city: "Los Angeles", country: "United States" },
  { code: "DXB", city: "Dubai", country: "United Arab Emirates" },
];

export const DEFAULT_ORIGIN = "SYD";

export function findAirport(code: string): Airport | undefined {
  return POPULAR_ORIGINS.find((a) => a.code === code.toUpperCase());
}
