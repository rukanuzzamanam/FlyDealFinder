import { DuffelLinksBookingProvider } from "./duffel-links";
import type { BookingMode, BookingProvider, BookingSession } from "./types";

export type { BookingProvider, BookingSession, BookingSessionParams, BookingMode } from "./types";

/**
 * Synchronous, config-only booking status — no network call, unlike
 * `createBookingSession`. Used wherever the UI just needs to know whether to
 * show a "Book" button, a "Test Booking" badge, or "coming soon" (e.g. once
 * per search-results page, rather than once per flight card).
 */
export function getBookingMode(): BookingMode {
  const configured = Boolean(process.env.DUFFEL_API_TOKEN) && process.env.DUFFEL_LINKS_ENABLED === "true";
  if (!configured) return "unavailable";
  return process.env.DUFFEL_LINKS_MODE === "live" ? "live" : "test";
}

/** Always reports "unavailable" — used until a booking provider is configured. */
class NullBookingProvider implements BookingProvider {
  readonly name = "none";

  async createBookingSession(): Promise<BookingSession> {
    return { mode: "unavailable", provider: this.name };
  }
}

let cachedProvider: BookingProvider | null = null;

/**
 * Returns the active `BookingProvider`. Defaults to a no-op provider that
 * always reports "unavailable" — Duffel Links only activates once both
 * `DUFFEL_API_TOKEN` and `DUFFEL_LINKS_ENABLED` are set, since Links needs a
 * separately-approved Duffel Payments account (see docs/revenue.md). This
 * must never silently go "live" just because a search token exists.
 */
export function getBookingProvider(): BookingProvider {
  if (cachedProvider) return cachedProvider;

  const apiToken = process.env.DUFFEL_API_TOKEN;
  const linksEnabled = process.env.DUFFEL_LINKS_ENABLED === "true";

  if (!apiToken || !linksEnabled) {
    cachedProvider = new NullBookingProvider();
    return cachedProvider;
  }

  const mode = process.env.DUFFEL_LINKS_MODE === "live" ? "live" : "test";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  cachedProvider = new DuffelLinksBookingProvider(
    apiToken,
    mode,
    siteUrl,
    process.env.BOOKING_MARKUP_RATE
  );
  return cachedProvider;
}
