import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildFlexibleDateCacheKey,
  searchFlexibleDates,
  type FlexibleDateSearchResult,
} from "@/lib/flexible-date-search";
import { CACHE_TTL_MS, flightSearchCache } from "@/lib/cache";
import { getFlightProvider, FlightProviderError } from "@/lib/flight-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-body";
import { flexibleDateSearchSchema } from "@/lib/validation";

export const runtime = "nodejs";

function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Clamps the requested month's 1st to today, so picking the current month
 * never searches already-past dates. */
function resolveMonthStart(month: string): string {
  const firstOfMonth = `${month}-01`;
  const today = todayUtcDateString();
  return firstOfMonth > today ? firstOfMonth : today;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  // Same budget as Anywhere search — this fans out to multiple dates too.
  const rateLimit = checkRateLimit(`flexible-dates:${ip}`, { limit: 6, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many flexible-date searches. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = flexibleDateSearchSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const monthStart = resolveMonthStart(input.month);

  const cacheKey = buildFlexibleDateCacheKey({
    origin: input.origin,
    destination: input.destination,
    monthStart,
    tripDurationDays: input.tripDurationDays,
    adults: input.adults,
    children: input.children,
    cabinClass: input.cabinClass,
  });

  const cached = flightSearchCache.get(cacheKey) as FlexibleDateSearchResult | undefined;
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const provider = getFlightProvider();
    const result = await searchFlexibleDates(provider, {
      origin: input.origin,
      destination: input.destination,
      monthStart,
      tripDurationDays: input.tripDurationDays,
      passengers: { adults: input.adults, children: input.children },
      cabinClass: input.cabinClass,
    });

    flightSearchCache.set(cacheKey, result, CACHE_TTL_MS.anywhere);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FlightProviderError && err.code === "CONFIG_ERROR") {
      console.error("Flight provider misconfigured:", err.message);
      return NextResponse.json(
        { error: "Flight search is currently unavailable." },
        { status: 503 }
      );
    }
    console.error("Unexpected flexible-date search error:", err);
    return NextResponse.json(
      { error: "Something went wrong while checking dates. Please try again." },
      { status: 500 }
    );
  }
}
