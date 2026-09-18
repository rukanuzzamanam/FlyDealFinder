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

/**
 * Formats a price with an explicit currency code prefix — "AUD $289",
 * "USD $190", "GBP £150" — never just "$289" on its own, since a bare `$`
 * would wrongly imply every price is in the viewer's home currency. Prices
 * are always shown in the provider's original currency; no FX conversion is
 * implemented (see docs/product-roadmap.md).
 */
export function formatPrice(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  try {
    const symbolAndAmount = new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).format(amount);
    return `${code} ${symbolAndAmount}`;
  } catch {
    return `${code} ${Math.round(amount)}`;
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

/** Formats a plain "YYYY-MM-DD" calendar date (no time component) as e.g.
 * "12 Oct" — used for flexible-date search results, which are calendar
 * dates rather than provider timestamps. */
export function formatCalendarDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "—";
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/**
 * "Checked 8 minutes ago" style relative time, for showing how fresh a
 * (possibly cached) fare actually is — never imply a cached price is live.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "recently";

  const diffMs = now.getTime() - then;
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes <= 0) return "just now";
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export function stopsLabel(stops: number): string {
  if (stops <= 0) return "Direct";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}
