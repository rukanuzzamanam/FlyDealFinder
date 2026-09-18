/**
 * Constant-time string comparison — used for comparing secrets (e.g. an
 * admin password) so a wrong guess can't be narrowed down by measuring how
 * long the comparison took to fail (a plain `===` short-circuits at the
 * first mismatched character). Implemented without Node's `crypto` module
 * so it also works on the Edge runtime (see src/proxy.ts).
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
