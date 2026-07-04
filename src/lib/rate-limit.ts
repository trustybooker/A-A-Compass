// Fixed-window rate limiting backed by the database so limits hold across
// serverless instances. Core logic takes an injected store so it is fully
// unit-testable; the Prisma store uses one atomic upsert.

export interface RateLimitStore {
  /**
   * Record one hit for `key` in the window beginning at `windowStart` and
   * return the hit count for that window (resetting stale windows).
   */
  increment(key: string, windowStart: Date): Promise<number>;
}

export interface RateLimitRule {
  /** Namespaced identity, e.g. "register:ip:1.2.3.4" or "login:email:a@b.c". */
  key: string;
  /** Maximum hits allowed per window. */
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function windowStartFor(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export async function rateLimit(
  store: RateLimitStore,
  rule: RateLimitRule,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowStart = windowStartFor(now, rule.windowMs);
  const count = await store.increment(rule.key, windowStart);
  const ok = count <= rule.limit;
  const windowEnd = windowStart.getTime() + rule.windowMs;
  return {
    ok,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: ok ? 0 : Math.max(1, Math.ceil((windowEnd - now.getTime()) / 1000)),
  };
}

/** In-memory store — used in tests and as a same-instance fallback. */
export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { windowStart: number; count: number }>();

  async increment(key: string, windowStart: Date): Promise<number> {
    const start = windowStart.getTime();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.windowStart !== start) {
      this.buckets.set(key, { windowStart: start, count: 1 });
      return 1;
    }
    bucket.count += 1;
    return bucket.count;
  }
}

/** Best-effort client identity for per-IP limits (first x-forwarded-for hop). */
export function clientIpFrom(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests(result: RateLimitResult, message?: string): Response {
  return Response.json(
    { error: message ?? "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}
