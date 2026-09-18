import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { DestinationDeal } from "@/lib/types";

interface DestinationCardProps {
  deal: DestinationDeal;
  origin: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  childrenCount: number;
}

export function DestinationCard({
  deal,
  origin,
  departureDate,
  returnDate,
  adults,
  childrenCount,
}: DestinationCardProps) {
  const { destination, cheapestPrice, currency } = deal;

  const params = new URLSearchParams({
    origin,
    destination: destination.airportCode,
    departureDate,
    ...(returnDate ? { returnDate } : {}),
    adults: String(adults),
    children: String(childrenCount),
  });

  const hasPrice = cheapestPrice != null && currency != null;

  return (
    <Link
      href={`/search?${params.toString()}`}
      className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          <span aria-hidden="true">{destination.emoji}</span> {destination.city}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {origin} → {destination.airportCode}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          {hasPrice ? (
            <>
              <p className="text-xs uppercase tracking-wide text-slate-400">From</p>
              <p className="text-xl font-bold text-brand">{formatPrice(cheapestPrice, currency)}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No fares found</p>
          )}
        </div>
        <span className="text-sm font-semibold text-brand group-hover:underline">
          View flights →
        </span>
      </div>
    </Link>
  );
}
