import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingProvider } from "@/lib/booking-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { bookingSessionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`booking:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bookingSessionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const session = await getBookingProvider().createBookingSession(parsed.data);
  return NextResponse.json(session);
}
