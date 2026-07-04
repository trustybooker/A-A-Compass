// Prisma-backed rate-limit store. One atomic statement per hit: stale
// windows reset, current windows increment — no read-modify-write race.

import { prisma } from "@/lib/prisma";
import type { RateLimitStore } from "@/lib/rate-limit";

export const prismaRateLimitStore: RateLimitStore = {
  async increment(key: string, windowStart: Date): Promise<number> {
    try {
      const rows = await prisma.$queryRaw<Array<{ count: number }>>`
        INSERT INTO rate_limit_buckets ("key", "windowStart", "count", "updatedAt")
        VALUES (${key}, ${windowStart}, 1, NOW())
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE
            WHEN rate_limit_buckets."windowStart" = EXCLUDED."windowStart"
            THEN rate_limit_buckets."count" + 1
            ELSE 1
          END,
          "windowStart" = EXCLUDED."windowStart",
          "updatedAt" = NOW()
        RETURNING "count"
      `;
      return rows[0]?.count ?? 1;
    } catch (error) {
      // A rate limiter must never take the product down. If the database is
      // unreachable the request path will fail on its own real queries.
      console.error("[rate-limit] store failure — allowing request", error);
      return 1;
    }
  },
};
