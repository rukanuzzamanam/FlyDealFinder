"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import type { BookingMode } from "@/lib/booking-providers";
import { isOfferExpired } from "@/lib/offer";

interface BookingButtonProps {
  mode: BookingMode;
  /** The provider's own offer id (`FlightResult.providerOfferId`) — the
   * booking flow keys off this, never off route/date alone. */
  providerOfferId: string;
  origin: string;
  destination: string;
  /** YYYY-MM-DD, derived from the flight's departure timestamp. */
  departureDate: string;
  returnDate?: string;
  /** ISO timestamp the offer stops being valid, if the provider gave one. */
  expiresAt?: string;
}

type ClickState = "idle" | "loading" | "failed" | "expired";

/**
 * Renders the flight card's booking CTA for a known `mode` (fetched once per
 * results page via GET /api/booking/status, not per card). Creating the
 * actual session happens on click — see POST /api/booking/session — so we
 * never show a booking link that isn't real.
 *
 * Duffel Links (our only booking provider today) can't deep-link to a
 * specific offer — clicking through opens a fresh Duffel-hosted search, so
 * the exact price/flight shown here isn't guaranteed at checkout. The
 * disclaimer below is not boilerplate — see docs/revenue.md.
 */
export function BookingButton({
  mode,
  providerOfferId,
  origin,
  destination,
  departureDate,
  returnDate,
  expiresAt,
}: BookingButtonProps) {
  const [state, setState] = useState<ClickState>("idle");

  if (mode === "unavailable") {
    return (
      <span className="min-h-11 rounded-lg bg-slate-100 px-5 py-2.5 text-center text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        Booking coming soon
      </span>
    );
  }

  async function handleClick() {
    if (isOfferExpired(expiresAt)) {
      setState("expired");
      return;
    }

    setState("loading");
    try {
      const res = await fetch("/api/booking/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerOfferId, origin, destination, departureDate, returnDate }),
      });
      const session = await res.json();
      track({ name: "booking_session_created", origin, destination, mode: session.mode });

      if (!res.ok || session.mode === "unavailable" || !session.url) {
        setState("failed");
        return;
      }

      window.open(session.url, "_blank", "noopener,noreferrer");
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {mode === "test" && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
          Test Booking
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "loading"}
        className="min-h-11 rounded-lg bg-brand px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {state === "loading" ? "Loading…" : "View Deal"}
      </button>
      <p className="max-w-[11rem] text-right text-[11px] leading-tight text-slate-500 dark:text-slate-400">
        Prices and availability are confirmed during booking.
      </p>
      {state === "failed" && (
        <p role="alert" className="max-w-[11rem] text-right text-xs text-red-600 dark:text-red-400">
          Couldn&apos;t start booking. Try again.
        </p>
      )}
      {state === "expired" && (
        <p role="alert" className="max-w-[11rem] text-right text-xs text-red-600 dark:text-red-400">
          This price may have changed. Search again for current fares.
        </p>
      )}
    </div>
  );
}
