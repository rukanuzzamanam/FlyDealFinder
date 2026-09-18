import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information FlyDealFinder collects, why, and how it's used.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={LEGAL_LAST_UPDATED}>
      <p>
        This policy explains what information FlyDealFinder (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
        collects when you use flydealfinder.com (the &ldquo;Site&rdquo;), and how we use it. This is a
        general information page and does not replace formal legal advice for your specific
        circumstances.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Search details</strong> — origin, destination, dates and passenger counts you
          enter, used to fetch flight results and, in aggregate, to improve which destinations we
          check.
        </li>
        <li>
          <strong>Price alert and newsletter emails</strong> — only if you submit them, used solely to
          send the alert or newsletter you signed up for.
        </li>
        <li>
          <strong>Contact form submissions</strong> — name, email and message, used only to respond to
          you.
        </li>
        <li>
          <strong>Basic technical data</strong> — IP address and request metadata, used for rate
          limiting and abuse prevention, not for tracking individuals across sites.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Third parties</h2>
      <p>
        Flight search requests are sent to our flight data provider (Duffel) to retrieve live fares.
        If you use a booking link, you may be taken to a booking partner&apos;s checkout, which has its
        own privacy policy. Where we use a database provider (Supabase) to store alerts, newsletter
        subscriptions or contact messages, that data is stored securely and accessed only by us.
      </p>

      <h2>Your choices</h2>
      <p>
        You can unsubscribe from newsletter emails at any time using the link in any email we send.
        To request access to, correction of, or deletion of your data, <a href="/contact">contact us</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        See our <a href="/cookies">Cookie Policy</a> for details on cookies and local storage used on
        this Site.
      </p>
    </LegalPage>
  );
}
