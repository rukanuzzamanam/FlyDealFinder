import { describe, expect, it } from "vitest";
import { anywhereSearchSchema, flightSearchSchema, priceAlertSchema } from "./validation";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("flightSearchSchema", () => {
  it("accepts a valid one-way search", () => {
    const result = flightSearchSchema.safeParse({
      origin: "syd",
      destination: "mel",
      departureDate: daysFromNow(10),
      adults: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.origin).toBe("SYD");
      expect(result.data.destination).toBe("MEL");
      expect(result.data.children).toBe(0);
    }
  });

  it("accepts ANYWHERE as a destination", () => {
    const result = flightSearchSchema.safeParse({
      origin: "SYD",
      destination: "anywhere",
      departureDate: daysFromNow(10),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a departure date in the past", () => {
    const result = flightSearchSchema.safeParse({
      origin: "SYD",
      destination: "MEL",
      departureDate: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = flightSearchSchema.safeParse({
      origin: "SYD",
      destination: "MEL",
      departureDate: "10 Oct 2030",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a return date before the departure date", () => {
    const result = flightSearchSchema.safeParse({
      origin: "SYD",
      destination: "MEL",
      departureDate: daysFromNow(20),
      returnDate: daysFromNow(10),
    });
    expect(result.success).toBe(false);
  });

  it("rejects origin equal to destination", () => {
    const result = flightSearchSchema.safeParse({
      origin: "SYD",
      destination: "SYD",
      departureDate: daysFromNow(10),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid airport code", () => {
    const result = flightSearchSchema.safeParse({
      origin: "SYDNEY",
      destination: "MEL",
      departureDate: daysFromNow(10),
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many passengers", () => {
    const result = flightSearchSchema.safeParse({
      origin: "SYD",
      destination: "MEL",
      departureDate: daysFromNow(10),
      adults: 15,
    });
    expect(result.success).toBe(false);
  });
});

describe("anywhereSearchSchema", () => {
  it("accepts a valid Anywhere search without a destination field", () => {
    const result = anywhereSearchSchema.safeParse({
      origin: "SYD",
      departureDate: daysFromNow(15),
      returnDate: daysFromNow(22),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a past departure date", () => {
    const result = anywhereSearchSchema.safeParse({
      origin: "SYD",
      departureDate: "2019-05-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("priceAlertSchema", () => {
  it("accepts a valid alert", () => {
    const result = priceAlertSchema.safeParse({
      email: "Traveller@Example.com",
      origin: "syd",
      destination: "nrt",
      targetPrice: 500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("traveller@example.com");
      expect(result.data.currency).toBe("AUD");
    }
  });

  it("rejects an invalid email", () => {
    const result = priceAlertSchema.safeParse({
      email: "not-an-email",
      origin: "SYD",
      destination: "NRT",
      targetPrice: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative target price", () => {
    const result = priceAlertSchema.safeParse({
      email: "traveller@example.com",
      origin: "SYD",
      destination: "NRT",
      targetPrice: -10,
    });
    expect(result.success).toBe(false);
  });
});
