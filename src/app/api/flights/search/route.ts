import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logSearch } from "@/lib/db/searches";
import { getFlightProvider, FlightProviderError } from "@/lib/flight-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-body";
import { buildSearchCacheKey, CACHE_TTL_MS, flightSearchCache } from "@/lib/cache";
import type { FlightSearchResult } from "@/lib/types";
import { flightSearchSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`search:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = flightSearchSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const input = parsed.data;

  if (input.destination === "ANYWHERE") {
    return NextResponse.json(
      { error: "Use /api/flights/anywhere for Anywhere searches" },
      { status: 400 }
    );
  }

  const cacheKey = buildSearchCacheKey({
    origin: input.origin,
    destination: input.destination,
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    adults: input.adults,
    children: input.children,
    cabinClass: input.cabinClass,
  });

  const cached = flightSearchCache.get(cacheKey) as FlightSearchResult | undefined;
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const provider = getFlightProvider();
    const result = await provider.searchFlights({
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      passengers: { adults: input.adults, children: input.children },
      cabinClass: input.cabinClass,
    });

    flightSearchCache.set(cacheKey, result, CACHE_TTL_MS.search);

    void logSearch({
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      passengers: input.adults + input.children,
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleSearchError(err);
  }
}

function handleSearchError(err: unknown): NextResponse {
  if (err instanceof FlightProviderError) {
    switch (err.code) {
      case "INVALID_REQUEST":
        return NextResponse.json(
          { error: "We couldn't search with those details. Check the airports and dates and try again." },
          { status: 400 }
        );
      case "UPSTREAM_TIMEOUT":
        return NextResponse.json(
          { error: "The search is taking longer than expected. Please try again." },
          { status: 504 }
        );
      case "RATE_LIMITED":
        return NextResponse.json(
          { error: "Flight search is temporarily busy. Please try again shortly." },
          { status: 503 }
        );
      case "CONFIG_ERROR":
        console.error("Flight provider misconfigured:", err.message);
        return NextResponse.json(
          { error: "Flight search is currently unavailable." },
          { status: 503 }
        );
      default:
        console.error("Flight provider error:", err.message);
        return NextResponse.json(
          { error: "We couldn't find flights for those dates. Try another date or destination." },
          { status: 502 }
        );
    }
  }

  console.error("Unexpected search error:", err);
  return NextResponse.json(
    { error: "Something went wrong while searching. Please try again." },
    { status: 500 }
  );
}
