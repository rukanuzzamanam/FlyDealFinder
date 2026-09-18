# Deployment (Vercel)

This app is a standard Next.js App Router project and deploys to Vercel
with no special configuration.

## 1. Push to a Git provider

Vercel deploys from GitHub/GitLab/Bitbucket. Push this repository there
first.

## 2. Import the project in Vercel

1. https://vercel.com/new → import the repository.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `next build` (default). Output: `.next` (default).

## 3. Set environment variables

In the Vercel project's **Settings → Environment Variables**, add (for
Production, and Preview if you want preview deploys to hit real Duffel
test-mode data):

| Variable | Value |
|---|---|
| `DUFFEL_API_TOKEN` | Your Duffel access token (use a **live** token only once you're ready for real fares — a test token works fine for a preview/demo deployment) |
| `NEXT_PUBLIC_SITE_URL` | Your production URL, e.g. `https://flydealfinder.vercel.app` |
| `SUPABASE_URL` | Your Supabase project URL (optional — see below) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (optional, **mark as sensitive/secret** in Vercel) |
| `ADMIN_PASSWORD` | A password for `/admin` (optional — leave unset to keep `/admin` closed) |

Never commit any of these to the repo. `.env.local` is git-ignored; only
`.env.example` (with blank values) is committed.

## 4. Provision the database (optional but recommended)

If you want price alerts and DB-backed destination management:

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` then
   `supabase/migrations/0002_seed_destinations.sql` against it (Supabase
   SQL editor, `psql`, or the Supabase CLI).
3. Add `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` to Vercel as above and
   redeploy.

Without this step, the app still deploys and works — it falls back to the
static destination list, and `/api/alerts` returns a 503.

## 5. Deploy

Vercel builds and deploys automatically on push. To verify locally first:

```bash
npm run build
npm run start
```

`npm run build` must complete with no TypeScript errors — it runs a type
check as part of the build.

## Notes on the MVP's in-memory cache and rate limiter

`src/lib/cache.ts` and `src/lib/rate-limit.ts` are per-instance,
in-memory implementations. On Vercel, that means:

- Each concurrent serverless function instance has its own cache/rate
  limit state — a burst of traffic can spin up multiple instances, each
  with a fresh, empty cache and its own rate-limit counters.
- This is an accepted MVP tradeoff (see `docs/architecture.md`), not a
  bug. Before scaling traffic meaningfully, replace both with a shared
  store (e.g. Upstash Redis) so caching and rate limiting are consistent
  across instances.

## Notes on `/admin`

`/admin` is protected by HTTP Basic Auth via `src/proxy.ts` (Next's
"proxy"/middleware convention), gated on `ADMIN_PASSWORD`. If that env var
is unset in a given environment, `/admin` returns `503` rather than being
open — fails closed, not open.
