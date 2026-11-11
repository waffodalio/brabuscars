/**
 * Small in-memory cache for GET results, shared by every page of the open
 * tab (stale-while-revalidate):
 * - a page already seen renders at once from `peekQuery`, then refreshes;
 * - identical requests made at the same time share one network call;
 * - a result younger than `maxAgeMs` is reused without a request.
 *
 * Browser only: on the server nothing is stored (the module would be shared
 * between visitors), so the first render always matches the server HTML.
 * Writes call {@link invalidateQueries}; a sign-in / sign-out clears it all
 * (an admin sees drafts that a visitor must not).
 */
const isBrowser = typeof window !== "undefined";

const store = new Map<string, { data: unknown; at: number }>();
const inflight = new Map<string, Promise<unknown>>();

export function cachedQuery<T>(key: string, fetcher: () => Promise<T>, maxAgeMs = 30_000): Promise<T> {
  if (!isBrowser) return fetcher();
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < maxAgeMs) return Promise.resolve(hit.data as T);
  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const request = fetcher()
    .then((data) => {
      store.set(key, { data, at: Date.now() });
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}

/** Last known result for `key`, however old (undefined if never loaded). */
export function peekQuery<T>(key: string): T | undefined {
  return isBrowser ? (store.get(key)?.data as T | undefined) : undefined;
}

/** Seeds an entry (e.g. each listing of a list, so its page opens at once). */
export function primeQuery<T>(key: string, data: T): void {
  if (isBrowser && !store.has(key)) store.set(key, { data, at: 0 });
}

/** Drops every entry whose key starts with `prefix` (all of them without one). */
export function invalidateQueries(prefix = ""): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
