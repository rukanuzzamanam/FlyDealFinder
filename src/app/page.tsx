import Link from "next/link";
import { Suspense } from "react";
import { DestinationCard } from "@/components/DestinationCard";
import { EmptyState } from "@/components/EmptyState";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PriceAlertForm } from "@/components/PriceAlertForm";
import { SearchForm } from "@/components/SearchForm";
import { DEFAULT_ORIGIN } from "@/lib/airports";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import { getHomepageDeals } from "@/lib/homepage-deals";

// Revalidate periodically (ISR) rather than fetching live fares on every
// request or freezing them forever at build time — keeps the homepage fast
// while still showing real, reasonably fresh prices.
export const revalidate = 1800; // 30 minutes

const POPULAR_ROUTES = [
  { href: "/sydney-to-bali-flights", label: "Sydney → Bali", emoji: "🌴" },
  { href: "/sydney-to-tokyo-flights", label: "Sydney → Tokyo", emoji: "🗼" },
  { href: "/sydney-to-bangkok-flights", label: "Sydney → Bangkok", emoji: "🛕" },
];

const EXPLORE_DESTINATION_CODES = ["DPS", "BKK", "SIN", "NRT", "AKL", "DXB"];

const WHY_FLYDEALFINDER = [
  {
    title: "Live flight prices",
    body: "Every fare comes straight from our flight search partner in real time — never invented or cached forever.",
    emoji: "📡",
  },
  {
    title: "Flexible search",
    body: "Don't know where to go? Search \"Anywhere\" and compare prices across dozens of destinations at once.",
    emoji: "🧭",
  },
  {
    title: "Worldwide destinations",
    body: "From short hops around Australia to long-haul trips across Asia, Europe and beyond.",
    emoji: "🌍",
  },
  {
    title: "Price alerts",
    body: "Set a target price for any route and we'll keep an eye on it for you.",
    emoji: "🔔",
  },
  {
    title: "Transparent pricing",
    body: "Prices shown are what the provider quotes — no hidden markup surprises at checkout.",
    emoji: "🔍",
  },
];

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
            Discover affordable destinations, compare flight prices and find your next trip for less.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <SearchForm initialOrigin={DEFAULT_ORIGIN} />
        </div>

        <div className="mx-auto mt-4 flex max-w-3xl justify-center">
          <Link href="/explore" className="text-sm font-semibold text-brand hover:underline">
            Or explore cheap destinations →
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            🔥 Cheap Flights From Sydney
          </h2>
          <Link href="/deals" className="hidden text-sm font-semibold text-brand hover:underline sm:block">
            See all deals →
          </Link>
        </div>
        <Suspense fallback={<DealsSkeleton />}>
          <HomeDeals />
        </Suspense>
      </section>

      <section className="bg-slate-50 px-4 py-12 sm:px-6 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Explore Anywhere</h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            Don&apos;t know where you want to go? Pick a region and see what&apos;s cheap right now.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {DEFAULT_DESTINATIONS.filter((d) => EXPLORE_DESTINATION_CODES.includes(d.airportCode)).map(
              (d) => (
                <Link
                  key={d.id}
                  href={`/search?origin=${DEFAULT_ORIGIN}&destination=${d.airportCode}&departureDate=${addDaysIso(
                    30
                  )}&returnDate=${addDaysIso(37)}&adults=1&children=0`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="text-3xl" aria-hidden="true">
                    {d.emoji}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{d.city}</span>
                </Link>
              )
            )}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/explore"
              className="inline-block rounded-xl border border-brand px-6 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              Explore Cheap Destinations
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Popular Routes</h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          Real routes travelers search for most, with route guides, typical durations and current deals.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {POPULAR_ROUTES.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="text-2xl" aria-hidden="true">
                {route.emoji}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{route.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-12 sm:px-6 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Flexible Travel</h2>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Not locked into exact dates? Search Anywhere for a whole month and we&apos;ll surface the
            cheapest days to fly across dozens of destinations.
          </p>
          <Link
            href="/search?origin=SYD&destination=ANYWHERE"
            className="mt-2 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Find the cheapest dates
          </Link>
        </div>
      </section>

      <section
        id="price-alerts"
        className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-12 sm:px-6"
      >
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Price Alerts</h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          Tell us where you want to go and your target price — we&apos;ll email you when fares drop.
        </p>
        <PriceAlertForm />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Why FlyDealFinder?</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {WHY_FLYDEALFINDER.map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <span className="text-2xl" aria-hidden="true">
                {item.emoji}
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand/5 px-4 py-12 sm:px-6 dark:bg-brand/10">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            Weekly Cheap Flight Deals
          </h2>
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            Get the best fares we find, straight to your inbox. No spam, unsubscribe anytime.
          </p>
          <NewsletterForm />
        </div>
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
