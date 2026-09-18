# SEO

Covers what's implemented, why these specific pages exist (and not more),
and how to set up Google Search Console.

## Why only a handful of landing pages

Google's own guidance warns against doorway pages and large numbers of
near-duplicate pages created primarily to manipulate search rankings (see
AGENTS.md section 15). So instead of programmatically generating a page per
origin×destination combination, this app ships a small number of
hand-authored pages, each with genuinely different, useful content:

- `/cheap-flights-from-sydney` — an origin hub page: live cheapest
  destinations from Sydney, FAQ, links to specific routes.
- `/sydney-to-bali-flights`, `/sydney-to-tokyo-flights`,
  `/sydney-to-bangkok-flights` — route pages for the three most obviously
  high-intent routes from the default origin, each with route-specific facts
  (typical duration, direct-flight availability, airlines currently serving
  the route) derived from a **live/cached search** (`src/lib/route-info.ts`),
  never hardcoded or invented.

`/deals` and `/explore` are also indexable — they're live, frequently
changing, genuinely useful listing pages, not thin content.

To add another route page: copy the pattern in
`src/app/sydney-to-bangkok-flights/page.tsx`, using the shared
`RouteLandingPage` component (`src/components/RouteLandingPage.tsx`) with
real, route-specific `intro`/`faq` copy — don't template out dozens of these
automatically. Remember to append the new URL to `src/app/sitemap.ts`.

## Structured data

- **Organization** + **WebSite** (with a `SearchAction`) — site-wide, in
  `src/app/layout.tsx`.
- **BreadcrumbList** — on every SEO landing page.
- **FAQPage** — only on pages that render a real, visible FAQ section (the
  four pages above) — never added to a page without matching visible content,
  per Google's structured-data guidelines.

All JSON-LD is built with `src/lib/json-ld.ts`'s `jsonLdString()`, which
escapes `<` per Next's JSON-LD guide
(`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`) to avoid script
injection via untrusted string data.

Validate any new structured data with Google's
[Rich Results Test](https://search.google.com/test/rich-results) or the
[Schema Markup Validator](https://validator.schema.org/) before shipping.

## Sitemap, robots, canonicals

- `src/app/sitemap.ts` — an explicit, short list (not a bulk/dynamic
  generator) — see the comment in that file.
- `src/app/robots.ts` — allows everything except `/api/` and `/admin/`.
- Each SEO page sets `alternates: { canonical: "<path>" }` in its
  `metadata` export, resolved against `metadataBase` (`NEXT_PUBLIC_SITE_URL`)
  set in `layout.tsx`.

## Google Search Console setup

1. Go to https://search.google.com/search-console and add a property for
   the production domain (set via `NEXT_PUBLIC_SITE_URL`).
2. Verify ownership — the simplest option for a Next.js app is the **HTML
   file** method (add the file Google gives you under `public/`) or a DNS
   TXT record; avoid the meta-tag method unless you're comfortable adding
   arbitrary third-party markup to `layout.tsx`.
3. Under **Sitemaps**, submit `https://<your-domain>/sitemap.xml`.
4. Use **URL Inspection** on `/`, `/deals`, `/explore`, and one route page
   to confirm they're indexable and the structured data is recognized.
5. Watch **Coverage**/**Pages** over the following weeks — if any page shows
   as "Crawled – currently not indexed", that's usually a signal it needs
   more unique content, not more programmatic pages.
