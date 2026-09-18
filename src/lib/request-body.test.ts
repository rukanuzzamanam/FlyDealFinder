import { describe, expect, it } from "vitest";
import { readJsonBody } from "./request-body";

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("readJsonBody", () => {
  it("parses a valid, small JSON body", async () => {
    const result = await readJsonBody(makeRequest(JSON.stringify({ origin: "SYD" })));
    expect(result).toEqual({ ok: true, data: { origin: "SYD" } });
  });

  it("rejects malformed JSON", async () => {
    const result = await readJsonBody(makeRequest("{not json"));
    expect(result.ok).toBe(false);
  });

  it("rejects a body larger than the byte cap, even without a Content-Length header", async () => {
    const hugeBody = JSON.stringify({ message: "x".repeat(200) });
    const result = await readJsonBody(makeRequest(hugeBody), 50);
    expect(result).toEqual({ ok: false, error: "Request body is too large" });
  });

  it("rejects early based on a spoofed-large Content-Length header", async () => {
    const result = await readJsonBody(
      makeRequest(JSON.stringify({ a: 1 }), { "content-length": "999999" }),
      50
    );
    expect(result).toEqual({ ok: false, error: "Request body is too large" });
  });

  it("accepts a body right at the byte cap", async () => {
    const body = JSON.stringify({ a: "x".repeat(10) }); // short, well under any reasonable cap
    const result = await readJsonBody(makeRequest(body), 1000);
    expect(result.ok).toBe(true);
  });
});
