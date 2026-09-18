import { afterEach, describe, expect, it, vi } from "vitest";
import { getBookingMode } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getBookingMode", () => {
  it("is unavailable with no configuration at all", () => {
    vi.stubEnv("DUFFEL_API_TOKEN", "");
    vi.stubEnv("DUFFEL_LINKS_ENABLED", "");
    expect(getBookingMode()).toBe("unavailable");
  });

  it("is unavailable when a search token exists but Links isn't explicitly enabled", () => {
    vi.stubEnv("DUFFEL_API_TOKEN", "duffel_test_abc");
    vi.stubEnv("DUFFEL_LINKS_ENABLED", "");
    expect(getBookingMode()).toBe("unavailable");
  });

  it("defaults to test mode once enabled, without an explicit mode set", () => {
    vi.stubEnv("DUFFEL_API_TOKEN", "duffel_test_abc");
    vi.stubEnv("DUFFEL_LINKS_ENABLED", "true");
    vi.stubEnv("DUFFEL_LINKS_MODE", "");
    expect(getBookingMode()).toBe("test");
  });

  it("only reports live when explicitly configured", () => {
    vi.stubEnv("DUFFEL_API_TOKEN", "duffel_live_abc");
    vi.stubEnv("DUFFEL_LINKS_ENABLED", "true");
    vi.stubEnv("DUFFEL_LINKS_MODE", "live");
    expect(getBookingMode()).toBe("live");
  });
});

describe("getBookingProvider", () => {
  it("returns a provider that reports unavailable when not configured", async () => {
    vi.resetModules();
    vi.stubEnv("DUFFEL_API_TOKEN", "");
    vi.stubEnv("DUFFEL_LINKS_ENABLED", "");
    const { getBookingProvider } = await import("./index");

    const session = await getBookingProvider().createBookingSession({
      origin: "SYD",
      destination: "DPS",
      departureDate: "2030-01-01",
    });

    expect(session).toEqual({ mode: "unavailable", provider: "none" });
  });
});
