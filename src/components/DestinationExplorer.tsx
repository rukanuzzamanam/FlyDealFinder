"use client";

import { useMemo, useState } from "react";
import { DestinationCard } from "@/components/DestinationCard";
import { EmptyState } from "@/components/EmptyState";
import { POPULAR_ORIGINS } from "@/lib/airports";
import { filterDeals } from "@/lib/deals-filter";
import type { DealsFilters } from "@/lib/deals-filter";
import type { AnywhereSearchResult, DestinationDeal, DestinationRegion } from "@/lib/types";

const REGIONS: DestinationRegion[] = [
  "Asia",
  "Australia",
  "New Zealand",
  "Middle East",
  "Europe",
  "North America",
];

interface DestinationExplorerProps {
  initialOrigin: string;
  departureDate: string;
  returnDate: string;
  initialDeals: DestinationDeal[];
}

export function DestinationExplorer({
  initialOrigin,
  departureDate,
  returnDate,
  initialDeals,
}: DestinationExplorerProps) {
  const [origin, setOrigin] = useState(initialOrigin);
  const [deals, setDeals] = useState(initialDeals);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<DealsFilters>({});

  async function handleOriginChange(nextOrigin: string) {
    setOrigin(nextOrigin);
    setIsLoading(true);
    try {
      const res = await fetch("/api/flights/anywhere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: nextOrigin, departureDate, returnDate, adults: 1, children: 0 }),
      });
      if (res.ok) {
        const data = (await res.json()) as AnywhereSearchResult;
        setDeals(data.deals);
      }
    } catch {
      // Keep showing the previous origin's deals rather than clearing the page.
    } finally {
      setIsLoading(false);
    }
  }

  const visibleDeals = useMemo(() => filterDeals(deals, filters), [deals, filters]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          From
          <select
            value={origin}
            onChange={(e) => handleOriginChange(e.target.value)}
            className="form-input"
          >
            {POPULAR_ORIGINS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Region
          <select
            value={filters.region ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, region: (e.target.value || undefined) as DestinationRegion | undefined }))
            }
            className="form-input"
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          Max price
          <select
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))
            }
            className="form-input"
          >
            <option value="">Any price</option>
            <option value="300">Under $300</option>
            <option value="500">Under $500</option>
            <option value="1000">Under $1,000</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={filters.directOnly ?? false}
            onChange={(e) => setFilters((f) => ({ ...f, directOnly: e.target.checked }))}
            className="h-4 w-4 accent-brand"
          />
          Direct only
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : visibleDeals.length === 0 ? (
        <EmptyState
          title="No destinations match those filters"
          message="Try widening your price range, choosing a different region, or turning off Direct only."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDeals.map((deal) => (
            <DestinationCard
              key={deal.destination.id}
              deal={deal}
              origin={origin}
              departureDate={departureDate}
              returnDate={returnDate}
              adults={1}
              childrenCount={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
