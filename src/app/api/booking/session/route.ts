import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingProvider } from "@/lib/booking-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-body";
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

  const body = await readJsonBody(request);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = bookingSessionSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  const session = await getBookingProvider().createBookingSession(parsed.data);
  return NextResponse.json(session);
}
