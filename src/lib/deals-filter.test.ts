import { describe, expect, it } from "vitest";
import { filterDeals } from "./deals-filter";
import type { DestinationDeal } from "./types";

function deal(overrides: Partial<DestinationDeal>): DestinationDeal {
  return {
    destination: {
      id: "x",
      city: "Test City",
      country: "Testland",
      airportCode: "TST",
      airportName: "Test Airport",
      region: "Asia",
      active: true,
    },
    cheapestPrice: 300,
    currency: "AUD",
    sampleFlight: null,
    ...overrides,
  };
}

describe("filterDeals", () => {
  it("returns all deals when no filters are set", () => {
    const deals = [deal({}), deal({ cheapestPrice: null })];
    expect(filterDeals(deals, {})).toEqual(deals);
  });

  it("filters by region", () => {
    const asia = deal({ destination: { ...deal({}).destination, region: "Asia" } });
    const europe = deal({ destination: { ...deal({}).destination, region: "Europe" } });
    expect(filterDeals([asia, europe], { region: "Europe" })).toEqual([europe]);
  });

  it("filters out deals above maxPrice, and deals with no price at all", () => {
    const cheap = deal({ cheapestPrice: 200 });
    const expensive = deal({ cheapestPrice: 900 });
    const noPrice = deal({ cheapestPrice: null });
    expect(filterDeals([cheap, expensive, noPrice], { maxPrice: 300 })).toEqual([cheap]);
  });

  it("filters to direct-only flights using the sample flight's stop count", () => {
    const direct = deal({
      sampleFlight: { ...baseFlight(), stops: 0 },
    });
    const oneStop = deal({
      sampleFlight: { ...baseFlight(), stops: 1 },
    });
    const noSample = deal({ sampleFlight: null });
    expect(filterDeals([direct, oneStop, noSample], { directOnly: true })).toEqual([direct]);
  });
});

function baseFlight() {
  return {
    id: "f1",
    airline: "Test Air",
    origin: "SYD",
    destination: "TST",
    departureTime: "2030-01-01T08:00:00Z",
    arrivalTime: "2030-01-01T10:00:00Z",
    duration: "2h",
    durationMinutes: 120,
    stops: 0,
    price: 300,
    currency: "AUD",
  };
}
