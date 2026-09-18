import { afterEach, describe, expect, it, vi } from "vitest";
import { DuffelFlightProvider } from "./duffel";
import { FlightProviderError } from "./types";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const baseParams = {
  origin: "SYD",
  destination: "DPS",
  departureDate: "2030-10-12",
  passengers: { adults: 1, children: 0 },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DuffelFlightProvider", () => {
  it("throws a config error when no token is provided", () => {
    expect(() => new DuffelFlightProvider("")).toThrow(FlightProviderError);
  });

  it("normalizes a Duffel offer into a FlightResult", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        data: {
          id: "orq_1",
          offers: [
            {
              id: "off_1",
              total_amount: "289.00",
              total_currency: "AUD",
              live_mode: false,
              expires_at: "2030-10-01T00:00:00Z",
              owner: { name: "Jetstar", iata_code: "JQ", logo_symbol_url: "https://x/logo.png" },
              slices: [
                {
                  id: "sl_1",
                  duration: "PT6H15M",
                  origin: { iata_code: "SYD", name: "Sydney" },
                  destination: { iata_code: "DPS", name: "Bali" },
                  segments: [
                    {
                      id: "seg_1",
                      departing_at: "2030-10-12T08:00:00Z",
                      arriving_at: "2030-10-12T14:15:00Z",
                      duration: "PT6H15M",
                      origin: { iata_code: "SYD", name: "Sydney" },
                      destination: { iata_code: "DPS", name: "Bali" },
                      marketing_carrier: { name: "Jetstar", iata_code: "JQ" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DuffelFlightProvider("test-token");
    const result = await provider.searchFlights(baseParams);

    expect(result.isEmpty).toBe(false);
    expect(result.results).toHaveLength(1);
    const flight = result.results[0];
    expect(flight.providerOfferId).toBe("off_1");
    expect(flight.airline).toBe("Jetstar");
    expect(flight.origin).toBe("SYD");
    expect(flight.destination).toBe("DPS");
    expect(flight.price).toBe(289);
    expect(flight.currency).toBe("AUD");
    expect(flight.stops).toBe(0);
    expect(flight.duration).toBe("6h 15m");
    expect(flight.bookingUrl).toBeNull();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(init.headers["Duffel-Version"]).toBe("v2");
  });

  it("computes stops from the number of segments in the outbound slice", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        data: {
          id: "orq_2",
          offers: [
            {
              id: "off_2",
              total_amount: "450.00",
              total_currency: "AUD",
              live_mode: false,
              expires_at: null,
              owner: { name: "Qantas", iata_code: "QF" },
              slices: [
                {
                  id: "sl_2",
                  duration: "PT10H",
                  origin: { iata_code: "SYD" },
                  destination: { iata_code: "NRT" },
                  segments: [
                    {
                      id: "seg_a",
                      departing_at: "2030-10-12T08:00:00Z",
                      arriving_at: "2030-10-12T10:00:00Z",
                      duration: "PT2H",
                      origin: { iata_code: "SYD" },
                      destination: { iata_code: "BNE" },
                      marketing_carrier: { name: "Qantas", iata_code: "QF" },
                    },
                    {
                      id: "seg_b",
                      departing_at: "2030-10-12T11:00:00Z",
                      arriving_at: "2030-10-12T18:00:00Z",
                      duration: "PT7H",
                      origin: { iata_code: "BNE" },
                      destination: { iata_code: "NRT" },
                      marketing_carrier: { name: "Qantas", iata_code: "QF" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DuffelFlightProvider("test-token");
    const result = await provider.searchFlights({ ...baseParams, destination: "NRT" });

    expect(result.results[0].stops).toBe(1);
  });

  it("returns isEmpty when Duffel finds no offers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(200, { data: { id: "orq_3", offers: [] } }))
    );

    const provider = new DuffelFlightProvider("test-token");
    const result = await provider.searchFlights(baseParams);

    expect(result.isEmpty).toBe(true);
    expect(result.results).toEqual([]);
  });

  it("maps a 422 response to an INVALID_REQUEST provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(422, { errors: [{ message: "origin is not a valid airport" }] })
      )
    );

    const provider = new DuffelFlightProvider("test-token");
    await expect(provider.searchFlights(baseParams)).rejects.toMatchObject({
      code: "INVALID_REQUEST",
    });
  });

  it("maps a 429 response to a RATE_LIMITED provider error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(429, {})));

    const provider = new DuffelFlightProvider("test-token");
    await expect(provider.searchFlights(baseParams)).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("sends a second slice when a return date is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { data: { id: "orq_4", offers: [] } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new DuffelFlightProvider("test-token");
    await provider.searchFlights({ ...baseParams, returnDate: "2030-10-19" });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.data.slices).toHaveLength(2);
    expect(body.data.slices[1]).toEqual({
      origin: "DPS",
      destination: "SYD",
      departure_date: "2030-10-19",
    });
  });
});
