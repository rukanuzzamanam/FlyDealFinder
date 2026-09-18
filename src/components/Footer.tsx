import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";

const LINK_COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Explore",
    links: [
      { href: "/deals", label: "Cheap Flight Deals" },
      { href: "/explore", label: "Explore Destinations" },
      { href: "/search", label: "Search Flights" },
      { href: "/flexible-dates", label: "Flexible Dates" },
      { href: "/cheap-flights-from-sydney", label: "Cheap Flights from Sydney" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-1">
          <p className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <span aria-hidden="true">✈️</span>
            Fly<span className="text-brand">Deal</span>Finder
          </p>
          <p>Find cheap flights anywhere in the world.</p>
          <NewsletterForm variant="compact" />
        </div>

        {LINK_COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 font-semibold text-slate-700 dark:text-slate-200">{col.title}</p>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 px-4 py-4 text-xs sm:px-6 dark:border-slate-800">
        <div className="mx-auto max-w-6xl">
          <p>
            Flight prices are provided by our search partner and may change before booking. We may
            earn a commission on bookings completed through FlyDealFinder — see our{" "}
            <Link href="/affiliate-disclosure" className="underline hover:text-brand">
              Affiliate Disclosure
            </Link>
            .
          </p>
          <p className="mt-2">&copy; {new Date().getFullYear()} FlyDealFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
