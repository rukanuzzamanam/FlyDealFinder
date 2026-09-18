"use client";

import Link from "next/link";
import { useState } from "react";
import { AirportCombobox } from "@/components/AirportCombobox";
import { EmptyState } from "@/components/EmptyState";
import { DEFAULT_ORIGIN, POPULAR_ORIGINS } from "@/lib/airports";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import { formatCalendarDate, formatPrice } from "@/lib/format";
import { FLEXIBLE_DATE_CANDIDATE_COUNT } from "@/lib/flexible-date-search";
import type { FlexibleDateSearchResult } from "@/lib/flexible-date-search";
import type { CabinClass } from "@/lib/types";

const CABIN_CLASSES: Array<{ value: CabinClass; label: string }> = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

function currentMonthValue(): string {
  return new Date().toISOString().slice(0, 7);
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: FlexibleDateSearchResult };

export function FlexibleDateSearchForm() {
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(DEFAULT_DESTINATIONS[0]?.airportCode ?? "DPS");
  const [month, setMonth] = useState(currentMonthValue());
  const [tripDurationDays, setTripDurationDays] = useState(7);
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/flights/flexible-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          month,
          tripDurationDays,
          adults: 1,
          children: 0,
          cabinClass,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Something went wrong. Please try again." });
        return;
      }
      setState({ status: "ready", data: json as FlexibleDateSearchResult });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200 sm:grid-cols-2 sm:p-6 dark:bg-slate-900 dark:ring-slate-800"
      >
        <AirportCombobox label="From" value={origin} onChange={setOrigin} options={POPULAR_ORIGINS} />
        <AirportCombobox
          label="To"
          value={destination}
          onChange={setDestination}
          options={DEFAULT_DESTINATIONS.map((d) => ({
            code: d.airportCode,
            city: d.city,
            country: d.country,
            emoji: d.emoji,
          }))}
        />

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Month
          <input
            type="month"
            required
            min={currentMonthValue()}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="form-input"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Trip length (days)
          <input
            type="number"
            min={1}
            max={30}
            value={tripDurationDays}
            onChange={(e) => setTripDurationDays(Number(e.target.value))}
            className="form-input"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          Cabin class
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value as CabinClass)}
            className="form-input"
          >
            {CABIN_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={state.status === "loading"}
          className="mt-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60 sm:col-span-2 sm:w-auto"
        >
          {state.status === "loading" ? "Checking dates…" : "Find Cheapest Dates"}
        </button>
      </form>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Checks {FLEXIBLE_DATE_CANDIDATE_COUNT} sample dates across the month (every few days, not
        every single day) to keep results fast — not an exhaustive day-by-day search.
      </p>

      <div className="mt-8">
        {state.status === "error" && (
          <EmptyState title="We couldn't check those dates" message={state.message} />
        )}

        {state.status === "ready" && state.data.options.every((o) => o.cheapestPrice == null) && (
          <EmptyState
            title="No fares found"
            message="We couldn't find fares for that route this month. Try a different month or destination."
          />
        )}

        {state.status === "ready" && state.data.options.some((o) => o.cheapestPrice != null) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.data.options
              .filter((o) => o.cheapestPrice != null)
              .map((option) => (
                <Link
                  key={option.departureDate}
                  href={`/search?origin=${origin}&destination=${destination}&departureDate=${option.departureDate}&returnDate=${option.returnDate}&adults=1&children=0&cabinClass=${cabinClass}`}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {formatCalendarDate(option.departureDate)} → {formatCalendarDate(option.returnDate)}
                  </p>
                  <p className="mt-2 text-xl font-bold text-brand">
                    {formatPrice(option.cheapestPrice as number, option.currency as string)}
                  </p>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
