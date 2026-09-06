type RateLimitBucket = {
  count: number;
  windowStartedAt: number;
};

const WINDOW_MS = 60_000;
const buckets = new Map<string, RateLimitBucket>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

/**
 * Fixed-window, in-memory limiter. Good enough to blunt runaway/looping
 * clients in a closed beta; it resets on redeploy and isn't shared across
 * serverless instances, so it is not a substitute for a durable limiter
 * (e.g. Redis) once traffic isn't fully trusted.
 */
export function checkRateLimit(key: string, maxRequestsPerWindow: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartedAt >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxRequestsPerWindow) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((WINDOW_MS - (now - bucket.windowStartedAt)) / 1000)
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
