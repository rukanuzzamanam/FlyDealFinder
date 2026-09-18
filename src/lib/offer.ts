/**
 * Whether a provider offer's `expiresAt` (e.g. Duffel's `offer.expires_at`)
 * has already passed. Offers expire quickly (often within minutes) — used to
 * stop the booking flow from proceeding on a price that's already stale
 * rather than letting the user click through to a checkout that will just
 * fail or show a different fare with no warning.
 */
export function isOfferExpired(expiresAt: string | undefined, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return false;
  return expiry <= now.getTime();
}
