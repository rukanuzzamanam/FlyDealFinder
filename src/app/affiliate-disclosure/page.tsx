import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "How FlyDealFinder may earn revenue from bookings made through the Site.",
};

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage title="Affiliate Disclosure" updated={LEGAL_LAST_UPDATED}>
      <p>
        FlyDealFinder is free to use for searching flights. To keep it running, we may earn revenue
        when you complete a booking through a link on this Site.
      </p>

      <h2>How this works</h2>
      <p>
        Where booking is available, it happens through a hosted checkout provided by our booking
        partner (currently Duffel Links). Our partner may apply a service markup that we configure,
        which can affect the final price you see at checkout compared to the base fare. This markup, if
        any, is set to fund the Site&apos;s operation — it does not change based on which airline or
        flight you choose.
      </p>

      <h2>Current status</h2>
      <p>
        Booking is currently in <strong>test mode</strong> while we complete our booking partner
        integration. Any button or session labeled &ldquo;Test Booking&rdquo; does not process a real
        payment or create a real reservation. We will update this page and clearly label bookings as
        live once real purchases are enabled.
      </p>

      <h2>No effect on search results</h2>
      <p>
        Commission or markup potential never determines which flights or destinations we show you —
        search results are ranked purely by the flight data itself (price, duration, stops, etc.),
        never by revenue potential.
      </p>
    </LegalPage>
  );
}
