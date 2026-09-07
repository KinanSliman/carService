import { headers } from 'next/headers';

/**
 * A fixed-window in-memory rate limiter.
 *
 * There is no session to check in this build, which makes rate limiting the
 * only thing standing between a public write endpoint on a live URL and
 * whoever finds it. It is not optional here.
 *
 * Its limitations, stated plainly rather than papered over:
 *  - the counter lives in the process, so on a multi-instance deployment each
 *    instance enforces its own limit;
 *  - a serverless cold start resets it;
 *  - IP is taken from `x-forwarded-for`, which is trustworthy only because
 *    Vercel overwrites it at the edge. Behind a different proxy it is not.
 *
 * For a demo whose write path creates rows nobody reads, that is the right
 * amount of machinery. A real product would put this in Redis, and the README
 * says so rather than implying this is production-grade.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Dev reloads the module on every edit; without this the limiter resets. */
const globalForLimiter = globalThis as unknown as { karajBuckets?: Map<string, Bucket> };
const store = globalForLimiter.karajBuckets ?? buckets;
if (process.env.NODE_ENV !== 'production') globalForLimiter.karajBuckets = store;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
};

export type RateLimitOptions = {
  /** Distinguishes limits that should not share a budget. */
  scope: string;
  limit: number;
  windowMs: number;
};

export function checkRateLimit(
  key: string,
  { scope, limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${scope}:${key}`;
  const existing = store.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + windowMs });
    // Sweep opportunistically rather than on a timer: a setInterval would keep
    // a serverless function alive, and the map is tiny.
    if (store.size > 5000) sweep(now);
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }
  return { ok: true, remaining: limit - existing.count, retryAfter };
}

function sweep(now: number) {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

/**
 * The caller's IP, or a constant fallback. The fallback deliberately shares one
 * bucket across every unidentifiable caller — that is stricter than handing
 * each of them their own budget, which is the safe direction to fail in.
 */
export async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headerList.get('x-real-ip')?.trim() || 'unknown';
}

/** Writes: strict. Twelve bookings an hour is far past honest demo use. */
export const BOOKING_LIMIT: RateLimitOptions = {
  scope: 'create-booking',
  limit: 12,
  windowMs: 60 * 60 * 1000,
};

/** Lookups: looser, but still bounded — this is a guessable-code endpoint. */
export const LOOKUP_LIMIT: RateLimitOptions = {
  scope: 'lookup-booking',
  limit: 20,
  windowMs: 5 * 60 * 1000,
};
