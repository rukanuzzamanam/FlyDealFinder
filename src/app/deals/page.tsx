import type { Metadata } from "next";
import { Suspense } from "react";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { DEFAULT_ORIGIN } from "@/lib/airports";
import { getDeals } from "@/lib/deals";
import { defaultSearchWindow } from "@/lib/search-window";

export const revalidate = 900; // 15 minutes

export const metadata: Metadata = {
  title: "Cheap Flight Deals",
  description:
    "Browse recently checked flight deals from Sydney for a 7-night trip across dozens of destinations, filterable by region, price and direct flights.",
};

export default function DealsPage() {
  const { departureDate, returnDate } = defaultSearchWindow();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">
        🔥 Cheap Flight Deals
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Recently checked fares across our destination list, for a 7-night trip departing in about a
        month — not every possible date. Prices shown are the lowest fare found for each route;
        availability may change before booking.
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />}>
        <DealsContent departureDate={departureDate} returnDate={returnDate} />
      </Suspense>
    </div>
  );
}

async function DealsContent({ departureDate, returnDate }: { departureDate: string; returnDate: string }) {
  const result = await getDeals(DEFAULT_ORIGIN, departureDate, returnDate);
  return (
    <DestinationExplorer
      initialOrigin={DEFAULT_ORIGIN}
      departureDate={departureDate}
      returnDate={returnDate}
      initialDeals={result.deals}
    />
  );
}
