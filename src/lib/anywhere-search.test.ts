import { describe, expect, it } from "vitest";
import { searchAnywhere } from "./anywhere-search";
import type { FlightProvider } from "./flight-providers/types";
import type { FlightResult, FlightSearchParams, FlightSearchResult } from "./types";

function makeResult(price: number, destination: string): FlightSearchResult {
  const flight: FlightResult = {
    id: `${destination}-${price}`,
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
});
