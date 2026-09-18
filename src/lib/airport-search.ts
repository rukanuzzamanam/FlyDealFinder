/**
 * Pure, framework-free filtering logic for the airport/destination
 * autocomplete (`AirportCombobox`). Kept separate from the component so it's
 * trivially unit-testable without React.
 */
export interface AirportOption {
  code: string;
  city: string;
  country: string;
  emoji?: string;
}

/**
 * Ranks options for a typeahead query: exact/prefix matches on city or code
 * first, then substring matches anywhere (city, code, or country), each
 * group preserving the input order. Returns all options, unfiltered, for an
 * empty/whitespace-only query so the full list shows on focus.
 */
export function filterAirportOptions(
  options: AirportOption[],
  query: string
): AirportOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;

  const prefixMatches: AirportOption[] = [];
  const substringMatches: AirportOption[] = [];

  for (const option of options) {
    const city = option.city.toLowerCase();
    const code = option.code.toLowerCase();

    if (city.startsWith(q) || code.startsWith(q)) {
      prefixMatches.push(option);
      continue;
    }

    const haystack = `${city} ${code} ${option.country.toLowerCase()}`;
    if (haystack.includes(q)) {
      substringMatches.push(option);
    }
  }

  return [...prefixMatches, ...substringMatches];
}

export function formatAirportLabel(option: AirportOption): string {
  return `${option.city} — ${option.code}, ${option.country}`;
}
