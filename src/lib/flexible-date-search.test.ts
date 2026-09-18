import { describe, expect, it } from "vitest";
import {
  FLEXIBLE_DATE_CANDIDATE_COUNT,
  FLEXIBLE_DATE_STEP_DAYS,
  buildFlexibleDateCacheKey,
  searchFlexibleDates,
} from "./flexible-date-search";
import type { FlightProvider } from "./flight-providers/types";
import type { FlightResult, FlightSearchParams, FlightSearchResult } from "./types";

function makeResult(price: number, departureDate: string): FlightSearchResult {
  const flight: FlightResult = {
    id: `f-${departureDate}`,
    providerOfferId: `off_${departureDate}`,
    airline: "Test Air",
    origin: "SYD",
    destination: "DPS",
    departureTime: `${departureDate}T08:00:00`,
    arrivalTime: `${departureDate}T14:00:00`,
    duration: "6h",
    durationMinutes: 360,
    stops: 0,
    price,
    currency: "AUD",
  };
  return { results: [flight], isEmpty: false, provider: "fake", searchedAt: new Date().toISOString() };
}

describe("searchFlexibleDates", () => {
  it("checks a bounded, evenly-spaced set of candidate dates, not every day", async () => {
    const seenDates: string[] = [];
    class RecordingProvider implements FlightProvider {
      readonly name = "recording";
      async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
        seenDates.push(params.departureDate);
        return makeResult(500, params.departureDate);
      }
    }

    await searchFlexibleDates(new RecordingProvider(), {
      origin: "SYD",
      destination: "DPS",
      monthStart: "2030-11-01",
      tripDurationDays: 7,
      passengers: { adults: 1, children: 0 },
    });

    expect(seenDates).toHaveLength(FLEXIBLE_DATE_CANDIDATE_COUNT);
    expect(new Set(seenDates).size).toBe(FLEXIBLE_DATE_CANDIDATE_COUNT); // no duplicates
    expect(seenDates).toEqual([
      "2030-11-01",
      `2030-11-${String(1 + FLEXIBLE_DATE_STEP_DAYS).padStart(2, "0")}`,
      `2030-11-${String(1 + FLEXIBLE_DATE_STEP_DAYS * 2).padStart(2, "0")}`,
      `2030-11-${String(1 + FLEXIBLE_DATE_STEP_DAYS * 3).padStart(2, "0")}`,
      `2030-11-${String(1 + FLEXIBLE_DATE_STEP_DAYS * 4).padStart(2, "0")}`,
      `2030-11-${String(1 + FLEXIBLE_DATE_STEP_DAYS * 5).padStart(2, "0")}`,
    ]);
  });

  it("derives the return date from the trip duration", async () => {
    class FakeProvider implements FlightProvider {
      readonly name = "fake";
      async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
        return makeResult(400, params.departureDate);
      }
    }

    const result = await searchFlexibleDates(new FakeProvider(), {
      origin: "SYD",
      destination: "DPS",
      monthStart: "2030-11-01",
      tripDurationDays: 7,
      passengers: { adults: 1, children: 0 },
    });

    expect(result.options[0].departureDate).toBe("2030-11-01");
    expect(result.options[0].returnDate).toBe("2030-11-08");
  });

  it("sorts options by cheapest price and tolerates per-date failures", async () => {
    class MixedProvider implements FlightProvider {
      readonly name = "mixed";
      async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
        if (params.departureDate === "2030-11-06") throw new Error("boom");
        if (params.departureDate === "2030-11-11") {
          return { results: [], isEmpty: true, provider: "mixed", searchedAt: new Date().toISOString() };
        }
        // Later dates cheaper, purely for a deterministic order to assert on.
        const price = 1000 - Number(params.departureDate.slice(-2)) * 10;
        return makeResult(price, params.departureDate);
      }
    }

    const result = await searchFlexibleDates(new MixedProvider(), {
      origin: "SYD",
      destination: "DPS",
      monthStart: "2030-11-01",
      tripDurationDays: 7,
      passengers: { adults: 1, children: 0 },
    });

    expect(result.options).toHaveLength(FLEXIBLE_DATE_CANDIDATE_COUNT);
    const withPrice = result.options.filter((o) => o.cheapestPrice != null);
    const sorted = [...withPrice].sort((a, b) => (a.cheapestPrice as number) - (b.cheapestPrice as number));
    expect(withPrice).toEqual(sorted);

    const failed = result.options.find((o) => o.departureDate === "2030-11-06");
    expect(failed?.cheapestPrice).toBeNull();
    expect(failed?.error).toBeTruthy();

    const empty = result.options.find((o) => o.departureDate === "2030-11-11");
    expect(empty?.cheapestPrice).toBeNull();
  });

  it("passes cabin class through to the provider", async () => {
    const seenCabinClasses: Array<string | undefined> = [];
    class RecordingProvider implements FlightProvider {
      readonly name = "recording";
      async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
        seenCabinClasses.push(params.cabinClass);
        return makeResult(500, params.departureDate);
      }
    }

    await searchFlexibleDates(new RecordingProvider(), {
      origin: "SYD",
      destination: "DPS",
      monthStart: "2030-11-01",
      tripDurationDays: 7,
      passengers: { adults: 1, children: 0 },
      cabinClass: "business",
    });

    expect(seenCabinClasses.every((c) => c === "business")).toBe(true);
  });
});

describe("buildFlexibleDateCacheKey", () => {
  const base = {
    origin: "SYD",
    destination: "DPS",
    monthStart: "2030-11-01",
    tripDurationDays: 7,
    adults: 1,
    children: 0,
  };

  it("distinguishes different months", () => {
    const a = buildFlexibleDateCacheKey(base);
    const b = buildFlexibleDateCacheKey({ ...base, monthStart: "2030-12-01" });
    expect(a).not.toBe(b);
  });

  it("distinguishes different trip durations", () => {
    const a = buildFlexibleDateCacheKey(base);
    const b = buildFlexibleDateCacheKey({ ...base, tripDurationDays: 14 });
    expect(a).not.toBe(b);
  });

  it("distinguishes different cabin classes", () => {
    const a = buildFlexibleDateCacheKey({ ...base, cabinClass: "economy" });
    const b = buildFlexibleDateCacheKey({ ...base, cabinClass: "business" });
    expect(a).not.toBe(b);
  });
});
