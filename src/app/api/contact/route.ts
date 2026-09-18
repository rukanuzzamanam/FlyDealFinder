import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DatabaseNotConfiguredError, saveContactMessage } from "@/lib/db/contact";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`contact:${ip}`, { limit: 5, windowMs: 60_000 });
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

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form and try again", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  // Honeypot: real visitors never see or fill this field, so a non-empty
  // value means a bot filled every input. Report success without saving
  // anything, so the bot has no signal to iterate on.
  if (parsed.data.companyWebsite) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  try {
    await saveContactMessage(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: "The contact form isn't available right now. Please try again later." },
        { status: 503 }
      );
    }
    console.error("Failed to save contact message:", err);
    return NextResponse.json(
      { error: "Couldn't send your message. Please try again." },
      { status: 500 }
    );
  }
}
