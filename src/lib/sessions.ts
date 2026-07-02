// Session creation flow: safety classification -> daily limit -> 6A engine.
// Structured with an injected repo so the daily-limit rule is unit-testable.

import { generateReading, type CompassInput, type CompassReading } from "@/lib/compass/engine";
import { classifyInput, type SafetyCheck } from "@/lib/safety";
import { dailySessionLimit, type TierId } from "@/lib/tiers";

export interface SessionRepo {
  countSessionsSince(userId: string, since: Date): Promise<number>;
}

export function startOfUtcDay(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export type CreateSessionOutcome =
  | { kind: "reading"; reading: CompassReading }
  | { kind: "safety"; safety: SafetyCheck }
  | { kind: "limit"; limit: number; message: string };

/**
 * Decide what a session request produces. Order matters:
 * 1. Safety concerns always answer — a crisis response must never be blocked
 *    by a daily limit.
 * 2. Free tier gets exactly one reading per UTC day (server-enforced).
 * 3. Otherwise generate the 6A reading.
 */
export async function createSessionOutcome(
  repo: SessionRepo,
  params: {
    userId: string;
    tier: TierId;
    input: Omit<CompassInput, "tier">;
    now?: Date;
  },
): Promise<CreateSessionOutcome> {
  const now = params.now ?? new Date();
  const combinedInput = [params.input.desire, params.input.fear, params.input.gratitude].join("\n");
  const safety = classifyInput(combinedInput);
  if (safety.concern !== "none") {
    return { kind: "safety", safety };
  }

  const limit = dailySessionLimit(params.tier);
  if (Number.isFinite(limit)) {
    const used = await repo.countSessionsSince(params.userId, startOfUtcDay(now));
    if (used >= limit) {
      return {
        kind: "limit",
        limit,
        message:
          "You've used today's free Compass Reading. Come back tomorrow — or upgrade to Plus for unlimited sessions, saved history, and deeper plans.",
      };
    }
  }

  const reading = generateReading({ ...params.input, tier: params.tier });
  return { kind: "reading", reading };
}
