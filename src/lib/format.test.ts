import { describe, expect, it } from "vitest";
import { formatMinutes, parseIsoDurationToMinutes, stopsLabel } from "./format";

describe("parseIsoDurationToMinutes", () => {
  it("parses hours and minutes", () => {
    expect(parseIsoDurationToMinutes("PT6H15M")).toBe(375);
  });

  it("parses hours only", () => {
    expect(parseIsoDurationToMinutes("PT2H")).toBe(120);
  });

  it("parses minutes only", () => {
    expect(parseIsoDurationToMinutes("PT45M")).toBe(45);
  });

  it("returns 0 for missing/invalid input", () => {
    expect(parseIsoDurationToMinutes(undefined)).toBe(0);
    expect(parseIsoDurationToMinutes(null)).toBe(0);
    expect(parseIsoDurationToMinutes("garbage")).toBe(0);
  });
});

describe("formatMinutes", () => {
  it("formats hours and minutes", () => {
    expect(formatMinutes(375)).toBe("6h 15m");
  });

  it("formats whole hours without minutes", () => {
    expect(formatMinutes(120)).toBe("2h");
  });

  it("formats minutes under an hour", () => {
    expect(formatMinutes(45)).toBe("45m");
  });

  it("handles zero/negative gracefully", () => {
    expect(formatMinutes(0)).toBe("—");
    expect(formatMinutes(-5)).toBe("—");
  });
});

describe("stopsLabel", () => {
  it("labels direct, single, and multi-stop flights", () => {
    expect(stopsLabel(0)).toBe("Direct");
    expect(stopsLabel(1)).toBe("1 stop");
    expect(stopsLabel(2)).toBe("2 stops");
  });
});
