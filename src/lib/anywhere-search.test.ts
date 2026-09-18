import { describe, expect, it } from "vitest";
import { buildAnywhereCacheKey, searchAnywhere } from "./anywhere-search";
import type { FlightProvider } from "./flight-providers/types";
import type { FlightResult, FlightSearchParams, FlightSearchResult } from "./types";

function makeResult(price: number, destination: string): FlightSearchResult {
  const flight: FlightResult = {
    id: `${destination}-${price}`,
    providerOfferId: `off_${destination}-${price}`,
    airline: "Test Air",
    origin: "SYD",
    destination,
    departureTime: "2030-11-01T08:00:00Z",
    arrivalTime: "2030-11-01T12:00:00Z",
    duration: "4h",
    durationMinutes: 240,
    stops: 0,
    price,
    currency: "AUD",
  };
  return { results: [flight], isEmpty: false, provider: "fake", searchedAt: new Date().toISOString() };
}

/** Deterministic fake provider: price derived from destination code so results are easy to assert on. */
class FakeProvider implements FlightProvider {
  readonly name = "fake";
  calls: FlightSearchParams[] = [];

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
    this.calls.push(params);
    if (params.destination === "FAIL") {
      throw new Error("simulated provider failure");
    }
    if (params.destination === "EMPTY") {
      return { results: [], isEmpty: true, provider: "fake", searchedAt: new Date().toISOString() };
    }
    // Cheaper for destinations earlier in the alphabet, purely for a deterministic order.
    const price = 100 + params.destination.charCodeAt(0);
    return makeResult(price, params.destination);
  }
}

describe("searchAnywhere", () => {
  it("returns deals sorted by cheapest price and excludes the origin", async () => {
    const provider = new FakeProvider();
    const result = await searchAnywhere(provider, {
      origin: "SYD",
      departureDate: "2030-11-01",
      passengers: { adults: 1, children: 0 },
    });

    expect(result.deals.length).toBeGreaterThan(0);
    expect(result.deals.every((d) => d.destination.airportCode !== "SYD")).toBe(true);

    const prices = result.deals.map((d) => d.cheapestPrice).filter((p): p is number => p != null);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  it("keeps searching other destinations when one fails or is empty", async () => {
    class MixedProvider implements FlightProvider {
      readonly name = "mixed";
      async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
        if (params.destination === "MEL") throw new Error("boom");
        if (params.destination === "BNE") {
          return { results: [], isEmpty: true, provider: "mixed", searchedAt: new Date().toISOString() };
        }
        return makeResult(300, params.destination);
      }
    }

    const result = await searchAnywhere(new MixedProvider(), {
      origin: "SYD",
      departureDate: "2030-11-01",
      passengers: { adults: 1, children: 0 },
    });

    const melDeal = result.deals.find((d) => d.destination.airportCode === "MEL");
    const bneDeal = result.deals.find((d) => d.destination.airportCode === "BNE");
    expect(melDeal?.cheapestPrice).toBeNull();
    expect(melDeal?.error).toBeTruthy();
    expect(bneDeal?.cheapestPrice).toBeNull();
  });

  it("applies a maximum price filter", async () => {
    const provider = new FakeProvider();
    const result = await searchAnywhere(provider, {
      origin: "SYD",
      departureDate: "2030-11-01",
      passengers: { adults: 1, children: 0 },
      maximumPrice: 150,
    });

    for (const deal of result.deals) {
      if (deal.cheapestPrice != null) {
        expect(deal.cheapestPrice).toBeLessThanOrEqual(150);
      }
    }
  });

  it("bounds the number of concurrent provider calls", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    class ConcurrencyTrackingProvider implements FlightProvider {
      readonly name = "tracking";
      async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
        return makeResult(200, params.destination);
      }
    }

    await searchAnywhere(new ConcurrencyTrackingProvider(), {
      origin: "SYD",
      departureDate: "2030-11-01",
      passengers: { adults: 1, children: 0 },
    });

    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it("passes cabin class through to the provider for every destination", async () => {
    const provider = new FakeProvider();
    await searchAnywhere(provider, {
      origin: "SYD",
      departureDate: "2030-11-01",
      passengers: { adults: 1, children: 0 },
      cabinClass: "business",
    });

    expect(provider.calls.length).toBeGreaterThan(0);
    expect(provider.calls.every((c) => c.cabinClass === "business")).toBe(true);
  });
});

describe("buildAnywhereCacheKey", () => {
  const base = {
    origin: "SYD",
    departureDate: "2030-11-01",
    returnDate: "2030-11-08",
    adults: 1,
    children: 0,
  };

  it("produces different cache keys for different budgets", () => {
    // Regression test: Sydney -> Anywhere with a $300 budget must never
    // return a cached result computed for an $800 budget, or vice versa.
    const cheapBudget = buildAnywhereCacheKey({ ...base, maximumPrice: 300 });
    const generousBudget = buildAnywhereCacheKey({ ...base, maximumPrice: 800 });
    expect(cheapBudget).not.toBe(generousBudget);
  });

  it("produces different cache keys for different cabin classes", () => {
    const economy = buildAnywhereCacheKey({ ...base, cabinClass: "economy" });
    const business = buildAnywhereCacheKey({ ...base, cabinClass: "business" });
    expect(economy).not.toBe(business);
  });

  it("produces different cache keys for a budget vs. no budget at all", () => {
    const noBudget = buildAnywhereCacheKey({ ...base });
    const withBudget = buildAnywhereCacheKey({ ...base, maximumPrice: 500 });
    expect(noBudget).not.toBe(withBudget);
  });

  it("produces the same cache key for identical inputs", () => {
    const a = buildAnywhereCacheKey({ ...base, maximumPrice: 500, cabinClass: "premium_economy" });
    const b = buildAnywhereCacheKey({ ...base, maximumPrice: 500, cabinClass: "premium_economy" });
    expect(a).toBe(b);
  });

  it("still distinguishes on origin/dates/passengers as before", () => {
    const a = buildAnywhereCacheKey(base);
    const differentOrigin = buildAnywhereCacheKey({ ...base, origin: "MEL" });
    const differentAdults = buildAnywhereCacheKey({ ...base, adults: 2 });
    expect(a).not.toBe(differentOrigin);
    expect(a).not.toBe(differentAdults);
  });
});
