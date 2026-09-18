const DEFAULT_MAX_BODY_BYTES = 10_000; // 10 KB — generous for these routes' small JSON payloads.

export type ParsedBody = { ok: true; data: unknown } | { ok: false; error: string };

/**
 * Safely reads and parses a request's JSON body, rejecting oversized
 * payloads (checked both via `Content-Length` and the actual bytes read)
 * before they're handed to `JSON.parse`. This is an application-level
 * safety net for these small public API routes, not a substitute for a
 * request-size limit enforced at the edge/infra level (e.g. a reverse
 * proxy or the hosting platform) under real load.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES
): Promise<ParsedBody> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return { ok: false, error: "Request body is too large" };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, error: "Invalid request body" };
  }

  if (raw.length > maxBytes) {
    return { ok: false, error: "Request body is too large" };
  }

  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, error: "Invalid request body" };
  }
}
