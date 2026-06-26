/** In-memory GET deduplication + short TTL cache (no React Query dependency). */

const inflight = new Map();
const cache = new Map();

const DEFAULT_TTL_MS = 30_000;

export function invalidateRequestCache(prefix = '') {
  for (const key of cache.keys()) {
    if (!prefix || key.startsWith(prefix)) cache.delete(key);
  }
}

export function clearRequestCache() {
  cache.clear();
}

export async function cachedRequest(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiry > now) {
    return hit.data;
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, expiry: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
