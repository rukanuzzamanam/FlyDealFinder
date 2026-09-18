import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of FlyDealFinder.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={LEGAL_LAST_UPDATED}>
      <p>
        By using FlyDealFinder (&ldquo;the Site&rdquo;), you agree to these terms. If you don&apos;t
        agree, please don&apos;t use the Site.
      </p>

      <h2>What FlyDealFinder is</h2>
      <p>
        FlyDealFinder is a flight-search and deal-discovery tool. We are not an airline, and we do not
        guarantee the accuracy, availability, or bookability of any fare shown — prices are supplied by
        third-party flight data providers and can change or expire before you complete a booking.
        Always confirm the final price and fare conditions before paying.
      </p>

      <h2>Bookings</h2>
      <p>
        Where booking is available, it is completed through a third-party booking partner under that
        partner&apos;s own terms and conditions, not directly by FlyDealFinder. Any booking link or
        session labeled &ldquo;Test Booking&rdquo; is a sandbox flow and does not create a real
        reservation or charge.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to misuse the Site — including attempting to circumvent rate limits, scraping
        content at scale, or using the Site for unlawful purposes.
      </p>

      <h2>No liability for third-party content</h2>
      <p>
        Flight data, airline names, logos and schedules are supplied by third parties and belong to
        their respective owners. We are not responsible for errors in that data.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms from time to time; continued use of the Site means you accept the current version.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? <a href="/contact">Contact us</a>.
      </p>
    </LegalPage>
  );
}
