"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AirportCombobox } from "@/components/AirportCombobox";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import { DEFAULT_ORIGIN, POPULAR_ORIGINS } from "@/lib/airports";
import { track } from "@/lib/analytics";
import type { CabinClass } from "@/lib/types";

const ANYWHERE_OPTION = { code: "ANYWHERE", city: "Anywhere", country: "Worldwide", emoji: "🌎" };
const RECENT_SEARCHES_KEY = "fdf_recent_searches";
const MAX_RECENT_SEARCHES = 5;

const CABIN_CLASSES: Array<{ value: CabinClass; label: string }> = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

interface RecentSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function loadRecentSearches(): RecentSearch[] {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(entry: RecentSearch): void {
  try {
    const existing = loadRecentSearches().filter(
      (s) => !(s.origin === entry.origin && s.destination === entry.destination)
    );
    const next = [entry, ...existing].slice(0, MAX_RECENT_SEARCHES);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, disabled) — recent searches just won't persist.
  }
}

function airportCity(code: string): string {
  if (code === "ANYWHERE") return "Anywhere";
  return (
    POPULAR_ORIGINS.find((a) => a.code === code)?.city ??
    DEFAULT_DESTINATIONS.find((d) => d.airportCode === code)?.city ??
    code
  );
}

interface SearchFormProps {
  initialOrigin?: string;
  initialDestination?: string;
}

export function SearchForm({ initialOrigin, initialDestination }: SearchFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initialOrigin ?? DEFAULT_ORIGIN);
  const [destination, setDestination] = useState(initialDestination ?? "ANYWHERE");
  const [tripType, setTripType] = useState<"return" | "oneway">("return");
  const [departureDate, setDepartureDate] = useState(addDaysIso(14));
  const [returnDate, setReturnDate] = useState(addDaysIso(21));
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>("economy");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) — must run client-side
    // only after mount, not as a lazy useState initializer, or the first
    // client render would mismatch the server-rendered (empty) markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentSearches(loadRecentSearches());
  }, []);

  function applyRecentSearch(entry: RecentSearch) {
    setOrigin(entry.origin);
    setDestination(entry.destination);
    setDepartureDate(entry.departureDate);
    if (entry.returnDate) {
      setTripType("return");
      setReturnDate(entry.returnDate);
    } else {
      setTripType("oneway");
    }
    setAdults(entry.adults);
    setChildren(entry.children);
  }

  function swapOriginDestination() {
    if (destination === "ANYWHERE") return;
    const nextOrigin = destination;
    const nextDestination = origin;
    setOrigin(nextOrigin);
    setDestination(nextDestination);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (origin === destination) {
      setError("Origin and destination can't be the same.");
      return;
    }
    const effectiveReturnDate = tripType === "return" ? returnDate : undefined;
    if (effectiveReturnDate && effectiveReturnDate < departureDate) {
      setError("Return date must be after the departure date.");
      return;
    }

    if (destination === "ANYWHERE") {
      track({ name: "anywhere_search", origin, destinationCount: DEFAULT_DESTINATIONS.length });
    } else {
      track({ name: "flight_search", origin, destination, oneWay: tripType === "oneway" });
    }

    saveRecentSearch({
      origin,
      destination,
      departureDate,
      returnDate: effectiveReturnDate,
      adults,
      children,
    });

    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      ...(effectiveReturnDate ? { returnDate: effectiveReturnDate } : {}),
      adults: String(adults),
      children: String(children),
      cabinClass,
      ...(budget ? { budget } : {}),
    });

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative">
          <AirportCombobox
            label="From"
            value={origin}
            onChange={setOrigin}
            options={POPULAR_ORIGINS}
            placeholder="Departure city or airport"
          />
        </div>

        <div className="relative">
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
            pinnedOption={ANYWHERE_OPTION}
            placeholder="Destination, or leave as Anywhere"
          />
          <button
            type="button"
            onClick={swapOriginDestination}
            disabled={destination === "ANYWHERE"}
            title="Swap origin and destination"
            aria-label="Swap origin and destination"
            className="absolute -top-1 right-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
          >
            ⇄
          </button>
        </div>

        <Field label="Trip type">
          <div className="flex gap-2" role="group" aria-label="Trip type">
            {(["return", "oneway"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={tripType === type}
                onClick={() => setTripType(type)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  tripType === type
                    ? "border-brand bg-brand/10 text-brand-dark dark:text-white"
                    : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {type === "return" ? "Return" : "One way"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Cabin class">
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value as CabinClass)}
            className="form-input"
            aria-label="Cabin class"
          >
            {CABIN_CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
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

        {tripType === "return" && (
          <Field label="Return">
            <input
              type="date"
              min={departureDate}
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="form-input"
              aria-label="Return date"
            />
          </Field>
        )}

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

        <Field label="Budget (optional)">
          <input
            type="number"
            min={1}
            placeholder="e.g. 500"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="form-input"
            aria-label="Maximum budget"
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {recentSearches.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recent:</span>
          {recentSearches.map((s, i) => (
            <button
              key={`${s.origin}-${s.destination}-${i}`}
              type="button"
              onClick={() => applyRecentSearch(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
            >
              {airportCity(s.origin)} → {airportCity(s.destination)}
            </button>
          ))}
        </div>
      )}

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
      >
        Search Cheap Flights
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
