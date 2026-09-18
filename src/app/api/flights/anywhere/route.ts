import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchAnywhere } from "@/lib/anywhere-search";
import { buildSearchCacheKey, CACHE_TTL_MS, flightSearchCache } from "@/lib/cache";
import { getFlightProvider, FlightProviderError } from "@/lib/flight-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { AnywhereSearchResult } from "@/lib/types";
import { anywhereSearchSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`anywhere:${ip}`, { limit: 6, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many Anywhere searches. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = anywhereSearchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const cacheKey = buildSearchCacheKey({
    scope: "anywhere",
    origin: input.origin,
    departureDate: input.departureDate,
    returnDate: input.returnDate,
    adults: input.adults,
    children: input.children,
  });

  const cached = flightSearchCache.get(cacheKey) as AnywhereSearchResult | undefined;
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const provider = getFlightProvider();
    const result = await searchAnywhere(provider, {
      origin: input.origin,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      passengers: { adults: input.adults, children: input.children },
      maximumPrice: input.maximumPrice,
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
    console.error("Unexpected anywhere search error:", err);
    return NextResponse.json(
      { error: "Something went wrong while checking destinations. Please try again." },
      { status: 500 }
    );
  }
}
