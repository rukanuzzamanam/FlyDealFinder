import { describe, expect, it } from "vitest";
import {
  anywhereSearchSchema,
  bookingSessionSchema,
  contactSchema,
  flexibleDateSearchSchema,
  flightSearchSchema,
  newsletterSignupSchema,
  priceAlertSchema,
} from "./validation";

function monthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 7);
}

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

  it("accepts an optional cabin class and a maximum price", () => {
    const result = anywhereSearchSchema.safeParse({
      origin: "SYD",
      departureDate: daysFromNow(15),
      cabinClass: "business",
      maximumPrice: 800,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cabinClass).toBe("business");
      expect(result.data.maximumPrice).toBe(800);
    }
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

describe("newsletterSignupSchema", () => {
  it("accepts an email with no preferences", () => {
    const result = newsletterSignupSchema.safeParse({ email: "Traveller@Example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("traveller@example.com");
      expect(result.data.preferences).toEqual([]);
    }
  });

  it("accepts a known preference", () => {
    const result = newsletterSignupSchema.safeParse({
      email: "traveller@example.com",
      preferences: ["Asia", "Business Class"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown preference", () => {
    const result = newsletterSignupSchema.safeParse({
      email: "traveller@example.com",
      preferences: ["Antarctica"],
    });
    expect(result.success).toBe(false);
  });
});

describe("contactSchema", () => {
  const validContact = {
    name: "Alex Traveller",
    email: "alex@example.com",
    message: "Hi, I have a question about a booking.",
  };

  it("accepts a valid message with an empty honeypot", () => {
    expect(contactSchema.safeParse({ ...validContact, companyWebsite: "" }).success).toBe(true);
    expect(contactSchema.safeParse(validContact).success).toBe(true);
  });

  it("rejects a message that's too short", () => {
    const result = contactSchema.safeParse({ ...validContact, message: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects a filled-in honeypot field", () => {
    const result = contactSchema.safeParse({ ...validContact, companyWebsite: "http://spam.example" });
    expect(result.success).toBe(false);
  });
});

describe("bookingSessionSchema", () => {
  it("accepts a valid one-way booking request", () => {
    const result = bookingSessionSchema.safeParse({
      providerOfferId: "off_0000ABC123",
      origin: "syd",
      destination: "dps",
      departureDate: daysFromNow(30),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.origin).toBe("SYD");
      expect(result.data.destination).toBe("DPS");
      expect(result.data.providerOfferId).toBe("off_0000ABC123");
    }
  });

  it("rejects a booking request with no provider offer id", () => {
    const result = bookingSessionSchema.safeParse({
      origin: "SYD",
      destination: "DPS",
      departureDate: daysFromNow(30),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty provider offer id", () => {
    const result = bookingSessionSchema.safeParse({
      providerOfferId: "",
      origin: "SYD",
      destination: "DPS",
      departureDate: daysFromNow(30),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid airport code", () => {
    const result = bookingSessionSchema.safeParse({
      providerOfferId: "off_0000ABC123",
      origin: "SYDNEY",
      destination: "DPS",
      departureDate: daysFromNow(30),
    });
    expect(result.success).toBe(false);
  });
});

describe("flexibleDateSearchSchema", () => {
  it("accepts a valid flexible-date search", () => {
    const result = flexibleDateSearchSchema.safeParse({
      origin: "syd",
      destination: "dps",
      month: monthsFromNow(1),
      tripDurationDays: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.origin).toBe("SYD");
      expect(result.data.destination).toBe("DPS");
      expect(result.data.tripDurationDays).toBe(10);
    }
  });

  it("defaults trip duration to 7 days", () => {
    const result = flexibleDateSearchSchema.safeParse({
      origin: "SYD",
      destination: "DPS",
      month: monthsFromNow(1),
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tripDurationDays).toBe(7);
  });

  it("rejects ANYWHERE as a destination (single route only for this iteration)", () => {
    const result = flexibleDateSearchSchema.safeParse({
      origin: "SYD",
      destination: "ANYWHERE",
      month: monthsFromNow(1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects origin equal to destination", () => {
    const result = flexibleDateSearchSchema.safeParse({
      origin: "SYD",
      destination: "SYD",
      month: monthsFromNow(1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed month", () => {
    const result = flexibleDateSearchSchema.safeParse({
      origin: "SYD",
      destination: "DPS",
      month: "2030-11-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a month in the past", () => {
    const result = flexibleDateSearchSchema.safeParse({
      origin: "SYD",
      destination: "DPS",
      month: "2019-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a trip duration over 30 days", () => {
    const result = flexibleDateSearchSchema.safeParse({
      origin: "SYD",
      destination: "DPS",
      month: monthsFromNow(1),
      tripDurationDays: 45,
    });
    expect(result.success).toBe(false);
  });
});
