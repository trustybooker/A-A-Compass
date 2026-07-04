import { describe, it, expect } from "vitest";
import {
  generateReading,
  scoreSession,
  modeFromScore,
  REQUIRED_OUTPUT_KEYS,
  AREAS,
  type CompassInput,
} from "@/lib/compass/engine";
import { checkOutputClaims } from "@/lib/safety";
import type { TierId } from "@/lib/tiers";

const baseInput = (tier: TierId): CompassInput => ({
  area: "Money",
  state: "Hopeful",
  desire: "I want a steady income from work that actually helps people.",
  fear: "waiting for perfect certainty before taking the next step",
  gratitude: "my health, my family, and the chance to start again",
  tier,
});

describe("6A engine required outputs", () => {
  it.each(["free", "plus", "pro"] as TierId[])(
    "every %s reading contains all eight required outputs",
    (tier) => {
      const reading = generateReading(baseInput(tier));
      for (const key of REQUIRED_OUTPUT_KEYS) {
        expect(reading[key], key).toBeTruthy();
        expect(String(reading[key]).length).toBeGreaterThan(10);
      }
      // ...and the rendered text carries every labeled section.
      for (const label of [
        "Truth reflection",
        "Deeper value",
        "Misalignment to release",
        "Definite vision",
        "One aligned action today",
        "One habit loop",
        "Gratitude anchor",
        "Service / increase-life action",
      ]) {
        expect(reading.fullText).toContain(label);
      }
    },
  );

  it.each(AREAS)("produces a complete reading for the %s area", (area) => {
    const reading = generateReading({ ...baseInput("free"), area });
    for (const key of REQUIRED_OUTPUT_KEYS) expect(reading[key]).toBeTruthy();
  });

  it("fills empty inputs with graceful defaults instead of failing", () => {
    const reading = generateReading({
      ...baseInput("free"),
      desire: "",
      fear: "   ",
      gratitude: "",
    });
    for (const key of REQUIRED_OUTPUT_KEYS) expect(reading[key]).toBeTruthy();
  });
});

describe("plans by tier", () => {
  it("free gets a 7-day plan but no 30-day plan", () => {
    const reading = generateReading(baseInput("free"));
    expect(reading.plan7Day).toBeTruthy();
    expect(reading.plan30Day).toBeUndefined();
  });

  it("plus gets 7-day and 30-day plans", () => {
    const reading = generateReading(baseInput("plus"));
    expect(reading.plan7Day).toBeTruthy();
    expect(reading.plan30Day).toBeTruthy();
    expect(reading.plan30Day).not.toMatch(/Advanced \(Pro\)/);
  });

  it("pro gets the advanced 30-day transformation plan", () => {
    const reading = generateReading(baseInput("pro"));
    expect(reading.plan30Day).toMatch(/Advanced \(Pro\)/);
  });
});

describe("advanced coaching modes", () => {
  it("applies a guided mode for pro", () => {
    const reading = generateReading({ ...baseInput("pro"), coachingMode: "Fear Release" });
    expect(reading.coachingMode).toBe("Fear Release");
    expect(reading.fullText).toContain("Fear Release mode");
  });

  it("ignores guided modes for free and plus (pro-only feature)", () => {
    for (const tier of ["free", "plus"] as TierId[]) {
      const reading = generateReading({ ...baseInput(tier), coachingMode: "Fear Release" });
      expect(reading.coachingMode).toBeUndefined();
      expect(reading.fullText).not.toContain("Fear Release mode");
    }
  });
});

describe("scoring", () => {
  it("keeps scores within 20-100", () => {
    expect(
      scoreSession({ state: "Stressed", desire: "", fear: "", gratitude: "" }),
    ).toBeGreaterThanOrEqual(20);
    expect(
      scoreSession({
        state: "Grateful",
        desire: "a".repeat(50),
        fear: "b".repeat(20),
        gratitude: "c".repeat(20),
      }),
    ).toBeLessThanOrEqual(100);
  });

  it("maps scores to alignment modes", () => {
    expect(modeFromScore(30)).toBe("Reset Mode");
    expect(modeFromScore(50)).toBe("Clarity Mode");
    expect(modeFromScore(60)).toBe("Alignment Mode");
    expect(modeFromScore(75)).toBe("Act & Build Mode");
    expect(modeFromScore(90)).toBe("Multiply & Serve Mode");
  });
});

describe("engine output safety", () => {
  it("never emits prohibited claims from any tier/area/day-variant combination", () => {
    // 10 consecutive seed days cycle through every phrasing pool.
    for (let day = 1; day <= 10; day++) {
      const seedDate = new Date(`2026-07-${String(day).padStart(2, "0")}T12:00:00Z`);
      for (const tier of ["free", "plus", "pro"] as TierId[]) {
        for (const area of AREAS) {
          const reading = generateReading({ ...baseInput(tier), area, seedDate });
          expect(checkOutputClaims(reading.fullText).ok, `${area}/${tier}/day${day}`).toBe(true);
        }
      }
    }
  });
});

describe("phrasing variety (seeded by day)", () => {
  it("is deterministic for the same inputs on the same day", () => {
    const seedDate = new Date("2026-07-04T09:00:00Z");
    const a = generateReading({ ...baseInput("plus"), seedDate });
    const b = generateReading({
      ...baseInput("plus"),
      seedDate: new Date("2026-07-04T21:30:00Z"), // same day, different time
    });
    expect(a.fullText).toBe(b.fullText);
  });

  it("rotates wording across days so a daily practice stays fresh", () => {
    const readings = Array.from({ length: 7 }, (_, i) =>
      generateReading({
        ...baseInput("free"),
        seedDate: new Date(`2026-07-${String(i + 1).padStart(2, "0")}T12:00:00Z`),
      }),
    );
    const visions = new Set(readings.map((r) => r.definiteVision));
    const actions = new Set(readings.map((r) => r.alignedAction));
    const services = new Set(readings.map((r) => r.serviceAction));
    expect(visions.size).toBeGreaterThan(1);
    expect(actions.size).toBeGreaterThan(1);
    expect(services.size).toBeGreaterThan(1);
    // ...while every variant still carries all eight required outputs.
    for (const reading of readings) {
      for (const key of REQUIRED_OUTPUT_KEYS) expect(reading[key]).toBeTruthy();
    }
  });
});
