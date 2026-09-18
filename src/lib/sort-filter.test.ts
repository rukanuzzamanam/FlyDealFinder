import { describe, expect, it } from "vitest";
import { filterResults, getAvailableAirlines, sortResults } from "./sort-filter";
import type { FlightResult } from "./types";

function flight(overrides: Partial<FlightResult>): FlightResult {
  return {
    id: "id",
    providerOfferId: "off_id",
    airline: "Jetstar",
    airlineCode: "JQ",
    origin: "SYD",
    destination: "DPS",
    departureTime: "2030-10-12T08:00:00Z",
    arrivalTime: "2030-10-12T13:00:00Z",
    duration: "5h",
    durationMinutes: 300,
    stops: 0,
    price: 300,
    currency: "AUD",
    ...overrides,
  };
}

describe("sortResults", () => {
  const results = [
    flight({ id: "a", price: 500, durationMinutes: 200, stops: 1, departureTime: "2030-10-12T12:00:00Z" }),
    flight({ id: "b", price: 200, durationMinutes: 400, stops: 0, departureTime: "2030-10-12T06:00:00Z" }),
    flight({ id: "c", price: 350, durationMinutes: 100, stops: 2, departureTime: "2030-10-12T20:00:00Z" }),
  ];

  it("sorts by cheapest", () => {
    expect(sortResults(results, "cheapest").map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by fastest", () => {
    expect(sortResults(results, "fastest").map((r) => r.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by fewest stops", () => {
    expect(sortResults(results, "fewest_stops").map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts by departure time", () => {
    expect(sortResults(results, "departure_time").map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("does not mutate the input array", () => {
    const original = [...results];
    sortResults(results, "cheapest");
    expect(results).toEqual(original);
  });
});

describe("filterResults", () => {
  const results = [
    flight({ id: "direct-cheap", price: 200, stops: 0, airlineCode: "JQ", departureTime: "2030-10-12T07:00:00Z" }),
    flight({ id: "one-stop-mid", price: 400, stops: 1, airlineCode: "QF", departureTime: "2030-10-12T14:00:00Z" }),
    flight({ id: "two-stop-expensive", price: 900, stops: 2, airlineCode: "QF", departureTime: "2030-10-12T23:00:00Z" }),
  ];

  it("filters by max price", () => {
    expect(filterResults(results, { maxPrice: 400 }).map((r) => r.id)).toEqual([
      "direct-cheap",
      "one-stop-mid",
    ]);
  });

  it("filters by stops, bucketing 2+ together", () => {
    expect(filterResults(results, { stops: [0] }).map((r) => r.id)).toEqual(["direct-cheap"]);
    expect(filterResults(results, { stops: [2] }).map((r) => r.id)).toEqual(["two-stop-expensive"]);
  });

  it("filters by airline code", () => {
    expect(filterResults(results, { airlineCodes: ["QF"] }).map((r) => r.id)).toEqual([
      "one-stop-mid",
      "two-stop-expensive",
    ]);
  });

  it("filters by departure window", () => {
    expect(filterResults(results, { departureWindows: ["morning"] }).map((r) => r.id)).toEqual([
      "direct-cheap",
    ]);
  });

  it("combines filters with AND semantics", () => {
    expect(
      filterResults(results, { maxPrice: 500, stops: [1] }).map((r) => r.id)
    ).toEqual(["one-stop-mid"]);
  });
});

describe("getAvailableAirlines", () => {
  it("dedupes and sorts by name", () => {
    const results = [
      flight({ id: "1", airline: "Qantas", airlineCode: "QF" }),
      flight({ id: "2", airline: "Jetstar", airlineCode: "JQ" }),
      flight({ id: "3", airline: "Qantas", airlineCode: "QF" }),
    ];
    expect(getAvailableAirlines(results)).toEqual([
      { code: "JQ", name: "Jetstar" },
      { code: "QF", name: "Qantas" },
    ]);
  });
});
