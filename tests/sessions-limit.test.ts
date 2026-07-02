import { describe, it, expect } from "vitest";
import { createSessionOutcome, startOfUtcDay, type SessionRepo } from "@/lib/sessions";
import type { CompassInput } from "@/lib/compass/engine";

const input: Omit<CompassInput, "tier"> = {
  area: "Purpose",
  state: "Ready",
  desire: "I want to find work that feels like contribution.",
  fear: "starting over too late",
  gratitude: "a clear morning and good coffee",
};

const repoWithCount = (count: number): SessionRepo => ({
  countSessionsSince: async () => count,
});

describe("free daily limit (server-enforced)", () => {
  it("allows the first free session of the day", async () => {
    const outcome = await createSessionOutcome(repoWithCount(0), {
      userId: "u1",
      tier: "free",
      input,
    });
    expect(outcome.kind).toBe("reading");
  });

  it("blocks the second free session of the day with an upgrade path", async () => {
    const outcome = await createSessionOutcome(repoWithCount(1), {
      userId: "u1",
      tier: "free",
      input,
    });
    expect(outcome.kind).toBe("limit");
    if (outcome.kind === "limit") {
      expect(outcome.limit).toBe(1);
      expect(outcome.message).toMatch(/upgrade to Plus/i);
    }
  });

  it("never counts sessions for plus/pro (unlimited)", async () => {
    for (const tier of ["plus", "pro"] as const) {
      const outcome = await createSessionOutcome(repoWithCount(999), {
        userId: "u1",
        tier,
        input,
      });
      expect(outcome.kind).toBe("reading");
    }
  });

  it("lets a crisis response through even when the daily limit is exhausted", async () => {
    const outcome = await createSessionOutcome(repoWithCount(5), {
      userId: "u1",
      tier: "free",
      input: { ...input, fear: "I keep thinking about ending my life" },
    });
    expect(outcome.kind).toBe("safety");
    if (outcome.kind === "safety") {
      expect(outcome.safety.concern).toBe("crisis");
      expect(outcome.safety.response).toMatch(/988/);
    }
  });
});

describe("startOfUtcDay", () => {
  it("returns midnight UTC of the given day", () => {
    const day = startOfUtcDay(new Date("2026-07-02T18:45:00Z"));
    expect(day.toISOString()).toBe("2026-07-02T00:00:00.000Z");
  });
});
