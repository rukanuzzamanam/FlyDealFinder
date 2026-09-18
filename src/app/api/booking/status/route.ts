import { NextRequest, NextResponse } from "next/server";
import { getBookingMode } from "@/lib/booking-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Cheap, config-only check — no external call — so the UI can decide once
 * per page whether to render a booking button, a test-mode badge, or
 * "coming soon", instead of guessing or calling this per flight card. Rate
 * limited generously since it's near-free per request, just for defense in
 * depth against abusive polling. */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`booking-status:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  return NextResponse.json({ mode: getBookingMode() });
}
