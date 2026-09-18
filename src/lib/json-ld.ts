/**
 * Safely serializes a JSON-LD object for a `<script type="application/ld+json">`
 * tag. Per Next.js's JSON-LD guide, `JSON.stringify` alone doesn't sanitize
 * strings that could break out of the script tag — replacing `<` with its
 * unicode escape closes that XSS vector.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
