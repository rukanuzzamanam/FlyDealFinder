"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import { DEFAULT_ORIGIN, POPULAR_ORIGINS } from "@/lib/airports";
import { track } from "@/lib/analytics";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface SearchFormProps {
  initialOrigin?: string;
}

export function SearchForm({ initialOrigin }: SearchFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initialOrigin ?? DEFAULT_ORIGIN);
  const [destination, setDestination] = useState("ANYWHERE");
  const [departureDate, setDepartureDate] = useState(addDaysIso(14));
  const [returnDate, setReturnDate] = useState(addDaysIso(21));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (origin === destination) {
      setError("Origin and destination can't be the same.");
      return;
    }
    if (returnDate && returnDate < departureDate) {
      setError("Return date must be after the departure date.");
      return;
    }

    if (destination === "ANYWHERE") {
      track({ name: "anywhere_search", origin, destinationCount: DEFAULT_DESTINATIONS.length });
    } else {
      track({ name: "flight_search", origin, destination, oneWay: !returnDate });
    }

    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      ...(returnDate ? { returnDate } : {}),
      adults: String(adults),
      children: String(children),
    });

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="From">
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="form-input"
            aria-label="Departure airport"
          >
            {POPULAR_ORIGINS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
          </select>
        </Field>

        <Field label="To">
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="form-input"
            aria-label="Destination airport"
          >
            <option value="ANYWHERE">🌎 Anywhere</option>
            {DEFAULT_DESTINATIONS.map((d) => (
              <option key={d.id} value={d.airportCode}>
                {d.city} ({d.airportCode})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Departure">
          <input
            type="date"
            required
            min={todayIso()}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="form-input"
            aria-label="Departure date"
          />
        </Field>

        <Field label="Return (optional)">
          <input
            type="date"
            min={departureDate}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="form-input"
            aria-label="Return date"
          />
        </Field>

        <Field label="Adults">
          <input
            type="number"
            min={1}
            max={9}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="form-input"
            aria-label="Number of adults"
          />
        </Field>

        <Field label="Children">
          <input
            type="number"
            min={0}
            max={8}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="form-input"
            aria-label="Number of children"
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
      >
        Search Flights
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      {children}
    </label>
  );
}
