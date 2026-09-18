import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How FlyDealFinder uses cookies and browser storage.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated={LEGAL_LAST_UPDATED}>
      <p>
        FlyDealFinder keeps cookie and browser-storage use to what&apos;s needed to make the Site
        work well.
      </p>

      <h2>What we use</h2>
      <ul>
        <li>
          <strong>Local storage (not a cookie)</strong> — your last few searches are saved in your
          browser&apos;s local storage so you can quickly repeat them. This data never leaves your
          browser and isn&apos;t sent to us.
        </li>
        <li>
          <strong>Essential session data</strong> — used only where required for the Site to function
          (e.g. the admin area&apos;s login).
        </li>
      </ul>
      <p>
        We do not currently use third-party advertising or cross-site tracking cookies. If that
        changes — for example, once we add an analytics provider — we will update this page and, where
        required, ask for your consent first.
      </p>

      <h2>Managing storage</h2>
      <p>
        You can clear cookies and local storage at any time through your browser&apos;s settings. Doing
        so will remove your recent-searches list.
      </p>
    </LegalPage>
  );
}
