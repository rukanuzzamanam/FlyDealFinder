import { afterEach, describe, expect, it, vi } from "vitest";
import { DuffelLinksBookingProvider } from "./duffel-links";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const baseParams = {
  providerOfferId: "off_0000ABC123",
  origin: "SYD",
  destination: "DPS",
  departureDate: "2030-10-12",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DuffelLinksBookingProvider", () => {
  it("creates a session and reports the configured mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, { data: { url: "https://pay.duffel.com/links/abc123" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DuffelLinksBookingProvider("test-token", "test", "https://flydealfinder.example", "0.05");
    const session = await provider.createBookingSession(baseParams);

    expect(session).toEqual({
      mode: "test",
      url: "https://pay.duffel.com/links/abc123",
      provider: "duffel_links",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.duffel.com/links/sessions");
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(init.headers["Duffel-Version"]).toBe("v2");

    const body = JSON.parse(init.body);
    expect(body.data.reference).toBe("off_0000ABC123");
    expect(body.data.markup_rate).toBe("0.05");
    expect(body.data.success_url).toBe("https://flydealfinder.example/booking/success");
    expect(body.data.failure_url).toBe("https://flydealfinder.example/booking/failed");
    expect(body.data.flights).toEqual({ enabled: true });
  });

  it("uses the provider offer id as the session reference, not the route/date", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, { data: { url: "https://pay.duffel.com/links/abc123" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DuffelLinksBookingProvider("test-token", "test", "https://flydealfinder.example");
    await provider.createBookingSession({ ...baseParams, providerOfferId: "off_specific_offer" });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.data.reference).toBe("off_specific_offer");
  });

  it("reports live mode when configured for live", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(201, { data: { url: "https://pay.duffel.com/links/xyz" } }))
    );

    const provider = new DuffelLinksBookingProvider("live-token", "live", "https://flydealfinder.example");
    const session = await provider.createBookingSession(baseParams);

    expect(session.mode).toBe("live");
  });

  it("omits markup_rate when none is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, { data: { url: "https://pay.duffel.com/links/abc123" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DuffelLinksBookingProvider("test-token", "test", "https://flydealfinder.example");
    await provider.createBookingSession(baseParams);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.data.markup_rate).toBeUndefined();
  });

  it("reports unavailable when Duffel returns a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(422, { errors: [{ message: "invalid session" }] }))
    );

    const provider = new DuffelLinksBookingProvider("test-token", "test", "https://flydealfinder.example");
    const session = await provider.createBookingSession(baseParams);

    expect(session).toEqual({ mode: "unavailable", provider: "duffel_links" });
  });

  it("reports unavailable when the response has no session url", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(201, { data: {} })));

    const provider = new DuffelLinksBookingProvider("test-token", "test", "https://flydealfinder.example");
    const session = await provider.createBookingSession(baseParams);

    expect(session.mode).toBe("unavailable");
  });

  it("reports unavailable when the network call throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const provider = new DuffelLinksBookingProvider("test-token", "test", "https://flydealfinder.example");
    const session = await provider.createBookingSession(baseParams);

    expect(session.mode).toBe("unavailable");
  });
});
