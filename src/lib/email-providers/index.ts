import type { EmailProvider, EmailSendResult } from "./types";

export type { EmailMessage, EmailProvider, EmailSendResult } from "./types";

/**
 * Always reports "not sent" — the real state today. No email provider
 * (Resend, Postmark, SES, ...) is configured yet, so nothing calling
 * `sendEmail` should ever tell a user an email went out. See
 * docs/product-roadmap.md for wiring up a real provider.
 */
class NullEmailProvider implements EmailProvider {
  readonly name = "none";

  async sendEmail(): Promise<EmailSendResult> {
    return { sent: false, provider: this.name };
  }
}

let cachedProvider: EmailProvider | null = null;

/**
 * Returns the active `EmailProvider`. When a real provider is added, branch
 * on its config env var here (e.g. `RESEND_API_KEY`) the same way
 * `getFlightProvider()`/`getBookingProvider()` do — callers (newsletter
 * signup, price alerts, contact form) already treat `sent: false` as the
 * honest default and must keep doing so until this returns something real.
 */
export function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;
  cachedProvider = new NullEmailProvider();
  return cachedProvider;
}

export function isEmailConfigured(): boolean {
  return getEmailProvider().name !== "none";
}
