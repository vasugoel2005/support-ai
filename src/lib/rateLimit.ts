/**
 * Fixed-window rate limiter with a pluggable store. The production store is
 * MongoDB-backed (see rateLimitStore.ts) so limits hold across serverless
 * instances; tests use an in-memory store.
 */
export interface RateLimitStore {
  /** Atomically increments the counter for `key` and returns the new count. */
  hit(key: string, windowMs: number, now: number): Promise<number>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): Promise<RateLimitResult> {
  const count = await store.hit(key, windowMs, now);
  const windowEnd = Math.floor(now / windowMs) * windowMs + windowMs;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, Math.ceil((windowEnd - now) / 1000)),
  };
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : headers.get("x-real-ip")) || "unknown";
}
