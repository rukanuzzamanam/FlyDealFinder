import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false },
};

export default async function BookingSuccessPage(props: PageProps<"/booking/success">) {
  const params = await props.searchParams;
  const orderId = typeof params.order_id === "string" ? params.order_id : undefined;
  const reference = typeof params.reference === "string" ? params.reference : undefined;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
      <span className="text-4xl" aria-hidden="true">✅</span>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Booking confirmed</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Your booking with our booking partner is complete.
        {reference && <> Reference: <strong>{reference}</strong>.</>}
        {orderId && <> Order ID: <strong>{orderId}</strong>.</>}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        A confirmation should also arrive by email from our booking partner shortly.
      </p>
      <Link href="/" className="text-sm font-semibold text-brand hover:underline">
        Back to FlyDealFinder
      </Link>
    </div>
  );
}
