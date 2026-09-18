import { describe, expect, it } from "vitest";
import { filterAirportOptions, formatAirportLabel } from "./airport-search";
import type { AirportOption } from "./airport-search";

const options: AirportOption[] = [
  { code: "SYD", city: "Sydney", country: "Australia" },
  { code: "SIN", city: "Singapore", country: "Singapore" },
  { code: "DPS", city: "Bali", country: "Indonesia" },
  { code: "NRT", city: "Tokyo", country: "Japan" },
];

describe("filterAirportOptions", () => {
  it("returns every option, in order, for an empty query", () => {
    expect(filterAirportOptions(options, "")).toEqual(options);
    expect(filterAirportOptions(options, "   ")).toEqual(options);
  });

  it("ranks city/code prefix matches before substring matches", () => {
    // "s" prefix-matches Sydney/Singapore by city and Singapore by code, and
    // also substring-matches Indonesia (Bali's country) — prefix hits must
    // still come first.
    const result = filterAirportOptions(options, "s");
    expect(result.map((o) => o.code)).toEqual(["SYD", "SIN", "DPS"]);
  });

  it("matches by IATA code case-insensitively", () => {
    const result = filterAirportOptions(options, "dps");
    expect(result).toEqual([options[2]]);
  });

  it("matches by country as a substring match", () => {
    const result = filterAirportOptions(options, "japan");
    expect(result).toEqual([options[3]]);
  });

  it("returns nothing when no field matches", () => {
    expect(filterAirportOptions(options, "zzz")).toEqual([]);
  });
});

describe("formatAirportLabel", () => {
  it("formats city, code, and country", () => {
    expect(formatAirportLabel(options[0])).toBe("Sydney — SYD, Australia");
  });
});
