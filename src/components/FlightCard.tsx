import { formatDate, formatPrice, formatTime, stopsLabel } from "@/lib/format";
import type { FlightResult } from "@/lib/types";

export function FlightCard({
  flight,
  onSelect,
}: {
  flight: FlightResult;
  onSelect?: (flight: FlightResult) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {flight.airlineLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, provider-hosted logo URLs
            <img
              src={flight.airlineLogoUrl}
              alt={`${flight.airline} logo`}
              width={36}
              height={36}
              loading="lazy"
              className="h-9 w-9 rounded-md object-contain"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {flight.airlineCode ?? "✈️"}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{flight.airline}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {flight.origin} → {flight.destination}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 sm:justify-center dark:text-slate-300">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {formatTime(flight.departureTime)} – {formatTime(flight.arrivalTime)}
            </p>
            <p>{formatDate(flight.departureTime)}</p>
          </div>
          <div className="text-center">
            <p className="font-medium">{flight.duration}</p>
            <p>{stopsLabel(flight.stops)}</p>
          </div>
          {flight.returnDepartureTime && (
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {formatTime(flight.returnDepartureTime)} – {formatTime(flight.returnArrivalTime)}
              </p>
              <p>{formatDate(flight.returnDepartureTime)} return</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
          <p className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
            {formatPrice(flight.price, flight.currency)}
          </p>
          {flight.bookingUrl ? (
            <a
              href={flight.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSelect?.(flight)}
              className="min-h-11 rounded-lg bg-brand px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              View Deal
            </a>
          ) : (
            <span className="min-h-11 rounded-lg bg-slate-100 px-5 py-2.5 text-center text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Booking coming soon
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
