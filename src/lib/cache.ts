/**
 * Minimal in-memory TTL cache for search results. Serverless deployments
 * (e.g. Vercel) run multiple isolated instances, so this only dedupes
 * repeated calls within the same warm instance/process — it is a best-effort
 * layer to cut down redundant Duffel calls, not a correctness guarantee.
 * Swap for Redis/Upstash if cross-instance caching becomes important.
 */
type Entry<T> = { value: T; expiresAt: number };

class TtlCache<T> {
  private store = new Map<string, Entry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

export const flightSearchCache = new TtlCache<unknown>();

export const CACHE_TTL_MS = {
  search: 5 * 60 * 1000, // 5 minutes
  anywhere: 10 * 60 * 1000, // 10 minutes
};

export function buildSearchCacheKey(parts: Record<string, string | number | undefined>): string {
  return Object.entries(parts)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}
