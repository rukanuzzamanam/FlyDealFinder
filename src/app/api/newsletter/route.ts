import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DatabaseNotConfiguredError, subscribeToNewsletter } from "@/lib/db/newsletter";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { newsletterSignupSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`newsletter:${ip}`, { limit: 10, windowMs: 60_000 });
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

  const parsed = newsletterSignupSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email address", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const subscriber = await subscribeToNewsletter(parsed.data);
    return NextResponse.json({ id: subscriber.id }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "Newsletter signups aren't available yet — the database isn't configured." },
        { status: 503 }
      );
    }
    console.error("Failed to save newsletter subscription:", err);
    return NextResponse.json(
      { error: "Couldn't save your subscription. Please try again." },
      { status: 500 }
    );
  }
}
