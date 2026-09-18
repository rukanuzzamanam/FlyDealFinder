import { describe, expect, it } from "vitest";
import { isOfferExpired } from "./offer";

const now = new Date("2030-01-01T12:00:00Z");

describe("isOfferExpired", () => {
  it("is false when there's no expiry at all", () => {
    expect(isOfferExpired(undefined, now)).toBe(false);
  });

  it("is false when the expiry is in the future", () => {
    expect(isOfferExpired("2030-01-01T12:30:00Z", now)).toBe(false);
  });

  it("is true when the expiry is in the past", () => {
    expect(isOfferExpired("2030-01-01T11:00:00Z", now)).toBe(true);
  });

  it("is true when the expiry is exactly now", () => {
    expect(isOfferExpired("2030-01-01T12:00:00Z", now)).toBe(true);
  });

  it("is false for an unparseable expiry rather than blocking booking on bad data", () => {
    expect(isOfferExpired("not-a-date", now)).toBe(false);
  });
});
