import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPriceAlert, DatabaseNotConfiguredError } from "@/lib/db/alerts";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-body";
import { priceAlertSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`alerts:${ip}`, { limit: 10, windowMs: 60_000 });
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

  const parsed = priceAlertSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid price alert details", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const alert = await createPriceAlert(parsed.data);
    return NextResponse.json({ id: alert.id }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "Price alerts aren't available yet — the database isn't configured." },
        { status: 503 }
      );
    }
    console.error("Failed to create price alert:", err);
    return NextResponse.json(
      { error: "Couldn't save your price alert. Please try again." },
      { status: 500 }
    );
  }
}
