import { describe, expect, it } from "vitest";
import {
  formatCalendarDate,
  formatMinutes,
  formatPrice,
  formatRelativeTime,
  parseIsoDurationToMinutes,
  stopsLabel,
} from "./format";

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

describe("formatCalendarDate", () => {
  it("formats a plain YYYY-MM-DD date", () => {
    expect(formatCalendarDate("2030-10-12")).toBe("12 Oct");
  });

  it("returns an em dash for a malformed date", () => {
    expect(formatCalendarDate("not-a-date")).toBe("—");
  });
});

describe("formatPrice", () => {
  it("always prefixes the ISO currency code, even for the local currency", () => {
    expect(formatPrice(289, "AUD")).toBe("AUD $289");
  });

  it("never displays a non-AUD price with a bare, ambiguous $ sign", () => {
    // Regression test: a bare "$190" for a USD fare would look like AUD.
    expect(formatPrice(190, "USD")).toBe("USD $190");
  });

  it("uses the correct symbol for other currencies, alongside the code", () => {
    expect(formatPrice(150, "GBP")).toBe("GBP £150");
  });

  it("uppercases a lowercase currency code", () => {
    expect(formatPrice(100, "eur")).toBe("EUR €100");
  });

  it("falls back gracefully for a malformed currency code instead of throwing", () => {
    expect(formatPrice(100, "AB")).toBe("AB 100");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2030-01-01T12:00:00Z");

  it("says 'just now' for the current moment", () => {
    expect(formatRelativeTime("2030-01-01T12:00:00Z", now)).toBe("just now");
  });

  it("formats minutes", () => {
    expect(formatRelativeTime("2030-01-01T11:52:00Z", now)).toBe("8 minutes ago");
    expect(formatRelativeTime("2030-01-01T11:59:00Z", now)).toBe("1 minute ago");
  });

  it("formats hours once past 60 minutes", () => {
    expect(formatRelativeTime("2030-01-01T09:00:00Z", now)).toBe("3 hours ago");
    expect(formatRelativeTime("2030-01-01T11:00:00Z", now)).toBe("1 hour ago");
  });

  it("formats days once past 24 hours", () => {
    expect(formatRelativeTime("2029-12-30T12:00:00Z", now)).toBe("2 days ago");
  });

  it("falls back gracefully for an unparseable timestamp", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("recently");
  });
});

describe("stopsLabel", () => {
  it("labels direct, single, and multi-stop flights", () => {
    expect(stopsLabel(0)).toBe("Direct");
    expect(stopsLabel(1)).toBe("1 stop");
    expect(stopsLabel(2)).toBe("2 stops");
  });
});
