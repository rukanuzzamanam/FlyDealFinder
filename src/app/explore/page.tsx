import type { Metadata } from "next";
import { Suspense } from "react";
import { DestinationExplorer } from "@/components/DestinationExplorer";
import { DEFAULT_ORIGIN } from "@/lib/airports";
import { getDeals } from "@/lib/deals";

export const revalidate = 900; // 15 minutes

export const metadata: Metadata = {
  title: "Explore Cheap Destinations",
  description:
    "Browse cheap flight destinations by region and budget — Asia, Europe, Australia and more, with live fares.",
};

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ExplorePage() {
  const departureDate = addDaysIso(30);
  const returnDate = addDaysIso(37);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-3xl font-bold text-slate-900 dark:text-white">Explore Anywhere</h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Don&apos;t know where to go? Browse every destination we cover, filter by region or budget,
        and see live fares for each.
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
