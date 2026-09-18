"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DestinationCard } from "@/components/DestinationCard";
import { EmptyState } from "@/components/EmptyState";
import { FiltersPanel } from "@/components/FiltersPanel";
import { FlightCard } from "@/components/FlightCard";
import { LoadingState } from "@/components/LoadingState";
import { SortBar } from "@/components/SortBar";
import type { BookingMode } from "@/lib/booking-providers";
import { POPULAR_ORIGINS } from "@/lib/airports";
import { track } from "@/lib/analytics";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import type { AnywhereSearchResult, CabinClass, FlightResult, FlightSearchResult } from "@/lib/types";
import {
  filterResults,
  getAvailableAirlines,
  sortResults,
  type FlightFilters,
  type SortOption,
} from "@/lib/sort-filter";

function cityName(code: string): string {
  return (
    POPULAR_ORIGINS.find((a) => a.code === code)?.city ??
    DEFAULT_DESTINATIONS.find((d) => d.airportCode === code)?.city ??
    code
  );
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready-flights"; data: FlightSearchResult }
  | { status: "ready-anywhere"; data: AnywhereSearchResult };

export function SearchResults() {
  const searchParams = useSearchParams();

  const origin = (searchParams.get("origin") ?? "").toUpperCase();
  const destination = (searchParams.get("destination") ?? "").toUpperCase();
  const departureDate = searchParams.get("departureDate") ?? "";
  const returnDate = searchParams.get("returnDate") ?? undefined;
  const adults = Number(searchParams.get("adults") ?? "1");
  const children = Number(searchParams.get("children") ?? "0");
  const cabinClass = (searchParams.get("cabinClass") as CabinClass | null) ?? undefined;
  const budgetParam = searchParams.get("budget");
  const budget = budgetParam ? Number(budgetParam) : undefined;

  const isAnywhere = destination === "ANYWHERE";
  const missingParams = !origin || !destination || !departureDate;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [sortBy, setSortBy] = useState<SortOption>("cheapest");
  const [filters, setFilters] = useState<FlightFilters>(budget ? { maxPrice: budget } : {});
  const [bookingMode, setBookingMode] = useState<BookingMode>("unavailable");

  useEffect(() => {
    fetch("/api/booking/status")
      .then((res) => res.json())
      .then((data) => setBookingMode(data.mode ?? "unavailable"))
      .catch(() => setBookingMode("unavailable"));
  }, []);

  useEffect(() => {
    if (missingParams) return;

    const controller = new AbortController();
    // Resets state for a new search whenever the URL's search params change
    // (e.g. user submits a new search) — an intentional refetch-on-param-
    // change effect, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    setFilters(budget ? { maxPrice: budget } : {});

    const endpoint = isAnywhere ? "/api/flights/anywhere" : "/api/flights/search";
    const body = isAnywhere
      ? { origin, departureDate, returnDate, adults, children, maximumPrice: budget }
      : { origin, destination, departureDate, returnDate, adults, children, cabinClass };

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Something went wrong. Please try again.");
        }
        setState(
          isAnywhere
            ? { status: "ready-anywhere", data: json as AnywhereSearchResult }
            : { status: "ready-flights", data: json as FlightSearchResult }
        );
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ status: "error", message: err.message ?? "Something went wrong. Please try again." });
      });

    return () => controller.abort();
  }, [
    origin,
    destination,
    departureDate,
    returnDate,
    adults,
    children,
    cabinClass,
    budget,
    isAnywhere,
    missingParams,
  ]);

  const flights = useMemo(
    () => (state.status === "ready-flights" ? state.data.results : []),
    [state]
  );
  const airlines = useMemo(() => getAvailableAirlines(flights), [flights]);
  const maxPrice = useMemo(
    () => flights.reduce((max, f) => Math.max(max, f.price), 0),
    [flights]
  );
  const visibleFlights = useMemo(
    () => sortResults(filterResults(flights, filters), sortBy),
    [flights, filters, sortBy]
  );

  if (missingParams) {
    return (
      <EmptyState
        title="Missing search details"
        message="We couldn't read your search. Please search again from the homepage."
      />
    );
  }

  if (state.status === "loading") {
    return <LoadingState anywhere={isAnywhere} />;
  }

  if (state.status === "error") {
    return (
      <EmptyState title="We couldn't complete that search" message={state.message} />
    );
  }

  if (state.status === "ready-anywhere") {
    const { data } = state;
    return (
      <div>
        <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
          Cheapest destinations from {cityName(origin)}
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {departureDate}
          {returnDate ? ` – ${returnDate}` : ""} · {adults + children} passenger
          {adults + children > 1 ? "s" : ""}
        </p>
        {data.deals.every((d) => d.cheapestPrice == null) ? (
          <EmptyState
            title="No fares found"
            message="We couldn't find fares for those dates. Try different dates or check back later."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.deals
              .filter((d) => d.cheapestPrice != null)
              .map((deal) => (
                <DestinationCard
                  key={deal.destination.id}
                  deal={deal}
                  origin={origin}
                  departureDate={departureDate}
                  returnDate={returnDate}
                  adults={adults}
                  childrenCount={children}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
        {cityName(origin)} → {cityName(destination)}
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        {departureDate}
        {returnDate ? ` – ${returnDate}` : ""} · {adults + children} passenger
        {adults + children > 1 ? "s" : ""}
      </p>

      {flights.length === 0 ? (
        <EmptyState
          title="No flights found"
          message="We couldn't find flights for those dates. Try another date or destination."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <FiltersPanel
            filters={filters}
            onChange={setFilters}
            airlines={airlines}
            maxPossiblePrice={Math.ceil(maxPrice)}
          />
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Cheapest flights
              </h2>
              <SortBar value={sortBy} onChange={setSortBy} />
            </div>

            {visibleFlights.length === 0 ? (
              <EmptyState
                title="No flights match your filters"
                message="Try widening your price range or clearing a filter."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {visibleFlights.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    bookingMode={bookingMode}
                    onSelect={(f: FlightResult) =>
                      track({ name: "deal_click", origin, destination, price: f.price })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
