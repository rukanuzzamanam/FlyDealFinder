import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DatabaseNotConfiguredError, subscribeToNewsletter } from "@/lib/db/newsletter";
import { getEmailProvider } from "@/lib/email-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/request-body";
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

  const body = await readJsonBody(request);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }

  const parsed = newsletterSignupSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email address", details: z.treeifyError(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const subscriber = await subscribeToNewsletter(parsed.data);

    // No email provider is configured yet (see src/lib/email-providers) —
    // this always reports `sent: false` today. Kept as a real call, not a
    // stub, so the response honestly reflects whether a confirmation email
    // actually went out once a provider is wired up.
    const emailResult = await getEmailProvider().sendEmail({
      to: parsed.data.email,
      subject: "You're subscribed to FlyDealFinder",
      text: "You're subscribed! We'll send you cheap-flight deals when they're available.",
    });

    return NextResponse.json({ id: subscriber.id, emailSent: emailResult.sent }, { status: 201 });
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
