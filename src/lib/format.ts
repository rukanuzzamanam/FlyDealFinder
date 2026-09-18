/** Parses an ISO 8601 duration (e.g. "PT6H15M") into total minutes. */
export function parseIsoDurationToMinutes(iso: string | undefined | null): number {
  if (!iso) return 0;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  return hours * 60 + minutes;
}

/** Formats total minutes as "6h 15m" (or "45m" when under an hour). */
export function formatMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatIsoDuration(iso: string | undefined | null): string {
  return formatMinutes(parseIsoDurationToMinutes(iso));
}

export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} $${Math.round(amount)}`;
  }
}

/**
 * Duffel timestamps (e.g. `departing_at`) are local wall-clock time at the
 * airport, with that airport's UTC offset attached. Formatting via `new
 * Date(iso)` + `Intl` would silently convert to the *rendering* machine's
 * timezone (server during SSR, then each visitor's browser on the client),
 * showing the wrong local departure time and causing hydration mismatches.
 * Parsing the wall-clock digits directly and formatting them pinned to
 * "UTC" sidesteps both problems.
 */
function parseIsoWallClock(
  iso: string
): { year: number; month: number; day: number; hour: number; minute: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  const c = parseIsoWallClock(iso);
  if (!c) return "—";
  const date = new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute));
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const c = parseIsoWallClock(iso);
  if (!c) return "—";
  const date = new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute));
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

export function stopsLabel(stops: number): string {
  if (stops <= 0) return "Direct";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}
