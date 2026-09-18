export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSendResult {
  /** True only if a real provider actually accepted the message for
   * delivery. Never true when no provider is configured — never claim an
   * email was sent when it wasn't (see AGENTS.md section 12/14). */
  sent: boolean;
  provider: string;
}

/**
 * Abstraction over "how a transactional/marketing email actually gets
 * sent", mirroring the `FlightProvider`/`BookingProvider` pattern. No
 * concrete provider (Resend, Postmark, SES, ...) is wired up yet — see
 * `getEmailProvider()` in `./index.ts` and docs/product-roadmap.md.
 */
export interface EmailProvider {
  readonly name: string;
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;
}
