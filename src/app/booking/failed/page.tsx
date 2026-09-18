import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Failed",
  robots: { index: false },
};

export default function BookingFailedPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
      <span className="text-4xl" aria-hidden="true">⚠️</span>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Booking didn&apos;t complete</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Something went wrong finishing your booking with our booking partner, and you have not been
        charged. Please search again — prices and availability can change quickly.
      </p>
      <Link
        href="/search"
        className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Search again
      </Link>
    </div>
  );
}
