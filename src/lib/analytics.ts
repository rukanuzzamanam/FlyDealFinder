"use client";

/**
 * Lightweight analytics event surface. Currently logs to the console in
 * development; swap the `emit` implementation for a real provider
 * (PostHog, Plausible, GA4, etc.) without touching call sites.
 *
 * Deliberately collects no PII beyond what's needed for the event itself
 * (e.g. price alert creation logs origin/destination/target price, not the
 * email address).
 */
export type AnalyticsEvent =
  | { name: "flight_search"; origin: string; destination: string; oneWay: boolean }
  | { name: "anywhere_search"; origin: string; destinationCount: number }
  | { name: "flight_result_view"; origin: string; destination: string; price: number }
  | { name: "deal_click"; origin: string; destination: string; price: number }
  | { name: "price_alert_created"; origin: string; destination: string; targetPrice: number }
  | { name: "newsletter_signup"; preferenceCount: number }
  | { name: "booking_session_created"; origin: string; destination: string; mode: string };

export function track(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event.name, event);
  }
  // TODO: forward to a real analytics provider once one is selected.
}
