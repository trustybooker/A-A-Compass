import { describe, it, expect } from "vitest";
import {
  rateLimit,
  windowStartFor,
  MemoryRateLimitStore,
  clientIpFrom,
} from "@/lib/rate-limit";

const HOUR = 60 * 60 * 1000;

describe("windowStartFor", () => {
  it("floors timestamps to the window boundary", () => {
    const now = new Date("2026-07-04T10:37:22Z");
    expect(windowStartFor(now, HOUR).toISOString()).toBe("2026-07-04T10:00:00.000Z");
  });
});

describe("rateLimit", () => {
  it("allows requests up to the limit and blocks beyond it", async () => {
    const store = new MemoryRateLimitStore();
    const rule = { key: "register:ip:1.2.3.4", limit: 3, windowMs: HOUR };
    const now = new Date("2026-07-04T10:00:00Z");

    for (let i = 0; i < 3; i++) {
      const result = await rateLimit(store, rule, now);
      expect(result.ok, `request ${i + 1}`).toBe(true);
    }
    const blocked = await rateLimit(store, rule, now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(3600);
  });

  it("resets when the window rolls over", async () => {
    const store = new MemoryRateLimitStore();
    const rule = { key: "k", limit: 1, windowMs: HOUR };
    expect((await rateLimit(store, rule, new Date("2026-07-04T10:59:00Z"))).ok).toBe(true);
    expect((await rateLimit(store, rule, new Date("2026-07-04T10:59:30Z"))).ok).toBe(false);
    // next hour = fresh window
    expect((await rateLimit(store, rule, new Date("2026-07-04T11:00:01Z"))).ok).toBe(true);
  });

  it("tracks keys independently", async () => {
    const store = new MemoryRateLimitStore();
    const now = new Date();
    expect((await rateLimit(store, { key: "a", limit: 1, windowMs: HOUR }, now)).ok).toBe(true);
    expect((await rateLimit(store, { key: "b", limit: 1, windowMs: HOUR }, now)).ok).toBe(true);
    expect((await rateLimit(store, { key: "a", limit: 1, windowMs: HOUR }, now)).ok).toBe(false);
  });
});

describe("clientIpFrom", () => {
  it("uses the first x-forwarded-for hop", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(clientIpFrom(req)).toBe("203.0.113.9");
  });

  it("falls back to unknown without headers", () => {
    expect(clientIpFrom(new Request("http://x"))).toBe("unknown");
  });
});
