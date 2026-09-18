import type { Metadata } from "next";
import { FlexibleDateSearchForm } from "@/components/FlexibleDateSearchForm";

export const metadata: Metadata = {
  title: "Flexible Dates",
  description:
    "Pick a route and a month, and find the cheapest days to fly — checks a spread of dates across the month, not a single fixed date.",
};

export default function FlexibleDatesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Find the Cheapest Dates</h1>
      <p className="mb-6 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Not locked into exact dates? Pick a route, a month, and how long you want to go for — we&apos;ll
        check a spread of dates across that month and show you the cheapest.
      </p>
      <FlexibleDateSearchForm />
    </div>
  );
}
