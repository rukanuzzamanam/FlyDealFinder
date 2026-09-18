/**
 * Runs `worker` over `items` with at most `limit` in flight at once.
 * Used to bound concurrent provider calls during an "Anywhere" search so we
 * never fire off dozens of simultaneous requests to Duffel.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runNext(): Promise<void> {
    const current = cursor++;
    if (current >= items.length) return;
    results[current] = await worker(items[current], current);
    await runNext();
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(workers);
  return results;
}

/** Wraps a promise with a timeout, rejecting with `onTimeoutError` if it fires first. */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeoutError: () => Error
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeoutError()), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
