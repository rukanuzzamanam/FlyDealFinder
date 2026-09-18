import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { DEFAULT_DESTINATIONS } from "@/lib/destinations";
import { jsonLdString } from "@/lib/json-ld";
import { getRouteSample } from "@/lib/route-info";
import { formatPrice, formatRelativeTime, stopsLabel } from "@/lib/format";
import { defaultSearchWindow } from "@/lib/search-window";

interface RouteLandingPageProps {
  origin: { code: string; city: string };
  destination: { code: string; city: string; country: string; emoji?: string };
  /** Real, curated route description — not generated per-request. */
  intro: string;
  faq: Array<{ question: string; answer: string }>;
  /** Airport codes of other destinations to suggest, e.g. same region. */
  relatedDestinationCodes: string[];
  canonicalPath: string;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function RouteLandingPage({
  origin,
  destination,
  intro,
  faq,
  relatedDestinationCodes,
  canonicalPath,
}: RouteLandingPageProps) {
  const { departureDate, returnDate } = defaultSearchWindow();
  const sample = await getRouteSample(origin.code, destination.code, departureDate, returnDate);

  const related = DEFAULT_DESTINATIONS.filter((d) => relatedDestinationCodes.includes(d.airportCode));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Deals", item: `${siteUrl}/deals` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${origin.city} to ${destination.city}`,
        item: `${siteUrl}${canonicalPath}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand">Home</Link> {" / "}
        <Link href="/deals" className="hover:text-brand">Deals</Link> {" / "}
        <span>{origin.city} to {destination.city}</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
        <span aria-hidden="true">{destination.emoji}</span> {origin.city} to {destination.city} Flights
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{intro}</p>

      <div className="mb-8">
        <SearchForm initialOrigin={origin.code} initialDestination={destination.code} />
      </div>

      <section className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard
          label="Cheapest fare found"
          value={sample.cheapest ? formatPrice(sample.cheapest.price, sample.cheapest.currency) : "Search above"}
        />
        <InfoCard
          label="Typical flight time"
          value={sample.cheapest ? sample.cheapest.duration : "Varies by airline"}
        />
        <InfoCard
          label="Direct flights"
          value={sample.cheapest ? stopsLabel(sample.cheapest.stops) : "Search above to check"}
        />
      </section>

      {sample.cheapest && (
        <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
          Checked {formatRelativeTime(sample.checkedAt)} for a 7-night trip departing in about a
          month. Prices and availability are confirmed during booking.
        </p>
      )}

      {sample.airlines.length > 0 && (
        <p className="mb-8 text-sm text-slate-600 dark:text-slate-300">
          Airlines recently showing fares on this route: {sample.airlines.join(", ")}.
        </p>
      )}

      <section className="mb-8 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        📈 Price history for {origin.city} → {destination.city} is coming soon — once we&apos;ve
        collected enough data, we&apos;ll show you real 30-day price trends here.
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
          {origin.city} to {destination.city} FAQ
        </h2>
        <div className="flex flex-col gap-4">
          {faq.map((item) => (
            <div key={item.question}>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{item.question}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            More destinations from {origin.city}
          </h2>
          <div className="flex flex-wrap gap-3">
            {related.map((d) => (
              <Link
                key={d.id}
                href={`/search?origin=${origin.code}&destination=${d.airportCode}&departureDate=${departureDate}&returnDate=${returnDate}&adults=1&children=0`}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200"
              >
                {d.emoji} {d.city}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
