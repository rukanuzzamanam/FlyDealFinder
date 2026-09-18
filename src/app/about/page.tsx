import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "About Us",
  description: "What FlyDealFinder is, how it works, and how we make money.",
};

export default function AboutPage() {
  return (
    <LegalPage title="About FlyDealFinder" updated={LEGAL_LAST_UPDATED}>
      <p>
        FlyDealFinder helps travelers answer a simple question: &ldquo;where can I go cheaply?&rdquo;
        Rather than starting with a fixed destination, you tell us where you&apos;re flying from and
        your budget, and we search across dozens of destinations to find the cheapest fares — either
        to a specific city, or with our &ldquo;Anywhere&rdquo; search across the whole list at once.
      </p>

      <h2>How search works</h2>
      <p>
        Flight prices shown on FlyDealFinder come from our flight search provider, Duffel, in real
        time. We never invent or guess a price — if live data isn&apos;t available for a route, we
        show that clearly instead of a placeholder number. Because fares change constantly, we also
        show when a price was last checked and recommend re-checking availability before booking.
      </p>

      <h2>How we make money</h2>
      <p>
        FlyDealFinder is a flight-search and deal-discovery service, not an airline or a travel
        agency. Where a booking link is shown, it may route through a booking partner that pays us a
        commission or includes a service markup, at no extra transparency cost to you — see our{" "}
        <a href="/affiliate-disclosure">Affiliate Disclosure</a>. Booking functionality is currently
        in test mode while we finish integrating with our booking partner; any &ldquo;Test
        Booking&rdquo; label means no real purchase is completed.
      </p>

      <h2>Where we&apos;re headed</h2>
      <p>
        We&apos;re actively building price history and deal-scoring (so a &ldquo;deal&rdquo; is based
        on real historical prices, not just a low number), price alerts, and a wider destination
        list. If there&apos;s a route or feature you&apos;d like to see, <a href="/contact">let us know</a>.
      </p>
    </LegalPage>
  );
}
