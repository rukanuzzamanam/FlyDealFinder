import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important limitations on the flight price and availability information shown on FlyDealFinder.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated={LEGAL_LAST_UPDATED}>
      <h2>Pricing and availability</h2>
      <p>
        Flight prices, schedules, and availability shown on FlyDealFinder are supplied by third-party
        flight data providers and reflect a specific point in time (shown as &ldquo;last checked&rdquo;
        where applicable). Fares can change or sell out within minutes, and the final price you&apos;re
        charged is always confirmed at the booking partner&apos;s checkout — never assume a price shown
        on FlyDealFinder is guaranteed until booking is complete.
      </p>

      <h2>&ldquo;Deals&rdquo; labeling</h2>
      <p>
        Where we don&apos;t yet have enough historical price data for a route, we show the cheapest
        currently available fare without claiming it&apos;s a discount — we only label something a
        &ldquo;deal&rdquo; once it&apos;s meaningfully below a real historical average price for that
        route.
      </p>

      <h2>Not travel advice</h2>
      <p>
        Content on this Site (route guides, FAQs, travel tips) is general information, not personalized
        travel, visa, health, or legal advice. Check official sources (airline, embassy, government
        travel advisories) before you travel.
      </p>

      <h2>Third-party trademarks</h2>
      <p>
        Airline names and logos shown are trademarks of their respective owners and are used only to
        identify the airline operating a flight — their appearance does not imply endorsement of
        FlyDealFinder.
      </p>
    </LegalPage>
  );
}
