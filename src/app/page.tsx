import { Suspense } from "react";
import { DestinationCard } from "@/components/DestinationCard";
import { EmptyState } from "@/components/EmptyState";
import { PriceAlertForm } from "@/components/PriceAlertForm";
import { SearchForm } from "@/components/SearchForm";
import { DEFAULT_ORIGIN } from "@/lib/airports";
import { getHomepageDeals } from "@/lib/homepage-deals";

// Revalidate periodically (ISR) rather than fetching live fares on every
// request or freezing them forever at build time — keeps the homepage fast
// while still showing real, reasonably fresh prices.
export const revalidate = 1800; // 30 minutes

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-sky-50 to-white px-4 pb-12 pt-14 sm:px-6 sm:pt-20 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Find Cheap Flights Anywhere
          </h1>
          <p className="max-w-xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Search thousands of flight options and discover where you can travel for less.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <SearchForm initialOrigin={DEFAULT_ORIGIN} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
          🔥 Cheap Flights From Sydney
        </h2>
        <Suspense fallback={<DealsSkeleton />}>
          <HomeDeals />
        </Suspense>
      </section>

      <section
        id="price-alerts"
        className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-12 sm:px-6"
      >
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Price Alert</h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          Tell us where you want to go and your target price — we&apos;ll email you when fares drop.
        </p>
        <PriceAlertForm />
      </section>
    </>
  );
}

async function HomeDeals() {
  const departureDate = addDaysIso(30);
  const returnDate = addDaysIso(37);
  const deals = await getHomepageDeals(DEFAULT_ORIGIN, departureDate, returnDate);

  if (deals.length === 0) {
    return (
      <EmptyState
        title="Live deals aren't available right now"
        message="We couldn't load live fares from Sydney at the moment. Try searching directly above, or check back shortly."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {deals.map((deal) => (
        <DestinationCard
          key={deal.destination.id}
          deal={deal}
          origin={DEFAULT_ORIGIN}
          departureDate={departureDate}
          returnDate={returnDate}
          adults={1}
          childrenCount={0}
        />
      ))}
    </div>
  );
}

function DealsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}
