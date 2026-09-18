import type { BookingProvider, BookingSession, BookingSessionParams } from "./types";

const DUFFEL_API_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Duffel Links: a Duffel-hosted, brandable checkout. Chosen over building a
 * direct Orders/Payments integration for the initial revenue path because it
 * needs no PCI-scoped card handling on our side and has markup built in.
 *
 * Docs (re-check before changing this file, per the pattern in
 * docs/duffel-integration.md):
 *   https://duffel.com/docs/guides/duffel-links — session creation, hosted
 *     checkout flow, redirect behavior, 24h session expiry.
 *   https://duffel.com/docs/guides/margin-and-markups — markup_rate/
 *     markup_amount semantics and currency/fee handling.
 *
 * Duffel Links requires an account approved for Duffel Payments in a
 * supported country — a real Duffel API token alone is not sufficient. This
 * provider therefore stays `unavailable` unless `DUFFEL_LINKS_ENABLED` is
 * explicitly set, and reports `DUFFEL_LINKS_MODE` (default "test") verbatim
 * rather than guessing live/test from the API token — see docs/revenue.md.
 */
export class DuffelLinksBookingProvider implements BookingProvider {
  readonly name = "duffel_links";

  constructor(
    private readonly apiToken: string,
    private readonly mode: "live" | "test",
    private readonly siteUrl: string,
    private readonly markupRate?: string
  ) {}

  async createBookingSession(params: BookingSessionParams): Promise<BookingSession> {
    const body = {
      data: {
        reference: `${params.origin}-${params.destination}-${Date.now()}`,
        success_url: `${this.siteUrl}/booking/success`,
        failure_url: `${this.siteUrl}/booking/failed`,
        abandonment_url: `${this.siteUrl}/search`,
        flights: { enabled: true },
        ...(this.markupRate ? { markup_rate: this.markupRate } : {}),
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${DUFFEL_API_BASE}/links/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Duffel-Version": DUFFEL_VERSION,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error("Duffel Links session creation failed:", response.status, await response.text());
        return { mode: "unavailable", provider: this.name };
      }

      const json = (await response.json()) as { data?: { url?: string } };
      if (!json.data?.url) {
        console.error("Duffel Links response did not include a session url");
        return { mode: "unavailable", provider: this.name };
      }

      return { mode: this.mode, url: json.data.url, provider: this.name };
    } catch (err) {
      console.error("Could not reach Duffel Links:", err);
      return { mode: "unavailable", provider: this.name };
    } finally {
      clearTimeout(timer);
    }
  }
}
