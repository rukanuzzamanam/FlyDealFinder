import type { Metadata } from "next";
import { Suspense } from "react";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { DEFAULT_ORIGIN } from "@/lib/airports";
import { getDeals } from "@/lib/deals";
import { defaultSearchWindow } from "@/lib/search-window";

export const revalidate = 900; // 15 minutes

export const metadata: Metadata = {
  title: "Explore Cheap Destinations",
  description:
    "Browse cheap flight destinations by region and budget — Asia, Europe, Australia and more, with recently checked fares.",
};

export default function ExplorePage() {
  const { departureDate, returnDate } = defaultSearchWindow();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">Explore Anywhere</h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Don&apos;t know where to go? Browse every destination we cover, filter by region or budget,
        and see recently checked fares for each (a 7-night trip departing in about a month).
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />}>
        <ExploreContent departureDate={departureDate} returnDate={returnDate} />
      </Suspense>
    </div>
  );
}

async function ExploreContent({ departureDate, returnDate }: { departureDate: string; returnDate: string }) {
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
