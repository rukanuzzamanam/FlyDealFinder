import { NextResponse } from "next/server";
import { getBookingMode } from "@/lib/booking-providers";

export const runtime = "nodejs";

/** Cheap, config-only check — no external call — so the UI can decide once
 * per page whether to render a booking button, a test-mode badge, or
 * "coming soon", instead of guessing or calling this per flight card. */
export async function GET() {
  return NextResponse.json({ mode: getBookingMode() });
}
