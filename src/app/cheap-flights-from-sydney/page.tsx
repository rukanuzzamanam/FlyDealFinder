import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DestinationCard } from "@/components/DestinationCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchForm } from "@/components/SearchForm";
import { DEFAULT_ORIGIN } from "@/lib/airports";
import { getDeals } from "@/lib/deals";
import { jsonLdString } from "@/lib/json-ld";
import { defaultSearchWindow } from "@/lib/search-window";

export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const CANONICAL_PATH = "/cheap-flights-from-sydney";

export const metadata: Metadata = {
  title: "Cheap Flights from Sydney (SYD)",
  description:
    "Find cheap flights from Sydney to destinations across Asia, the Pacific, Europe and beyond, with fares checked regularly.",
  alternates: { canonical: CANONICAL_PATH },
};

const FAQ = [
  {
    question: "What's the best way to find cheap flights from Sydney?",
    answer:
      "Use our Anywhere search to compare recently checked fares from Sydney to dozens of destinations at once, or set a price alert on a specific route to get notified when it drops.",
  },
  {
    question: "Which airport do flights from Sydney depart from?",
    answer: "Almost all international and domestic flights from Sydney depart from Sydney Airport (SYD), also known as Kingsford Smith Airport.",
  },
  {
    question: "How far in advance should I book flights from Sydney?",
    answer:
      "It varies by route and season. Comparing flexible dates (see the search above) usually shows you the cheapest days to fly for your destination.",
  },
];

export default function Page() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Cheap Flights from Sydney", item: `${siteUrl}${CANONICAL_PATH}` },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand">Home</Link> {" / "}
        <span>Cheap Flights from Sydney</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
        Cheap Flights from Sydney (SYD)
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Sydney Airport (SYD) connects to destinations across the Pacific, Asia, the Middle East,
        Europe and the Americas. Below are recently checked fares for a 7-night trip departing in
        about a month — or search your own dates above.
      </p>

      <div className="mb-8">
        <SearchForm initialOrigin={DEFAULT_ORIGIN} />
      </div>

      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
        Recently cheapest destinations from Sydney
      </h2>
      <Suspense fallback={<DealsSkeleton />}>
        <SydneyDeals />
      </Suspense>

      <section className="mt-10 mb-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Popular routes from Sydney</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/sydney-to-bali-flights" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200">
            🌴 Sydney to Bali
          </Link>
          <Link href="/sydney-to-tokyo-flights" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200">
            🗼 Sydney to Tokyo
          </Link>
          <Link href="/sydney-to-bangkok-flights" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200">
            🛕 Sydney to Bangkok
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">FAQ</h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((item) => (
            <div key={item.question}>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{item.question}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function SydneyDeals() {
  const { departureDate, returnDate } = defaultSearchWindow();
  const result = await getDeals(DEFAULT_ORIGIN, departureDate, returnDate);
  const topDeals = result.deals.filter((d) => d.cheapestPrice != null).slice(0, 9);

  if (topDeals.length === 0) {
    return (
      <EmptyState
        title="Recently checked deals aren't available right now"
        message="We couldn't check fares from Sydney at the moment. Try searching directly above."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topDeals.map((deal) => (
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
