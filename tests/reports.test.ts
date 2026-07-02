import { describe, it, expect } from "vitest";
import { buildWeeklyReport, weekStartOf } from "@/lib/reports";
import { buildPatternSummary, patternMemoryPrompt } from "@/lib/patterns";
import type { SessionSlice } from "@/lib/patterns";

function makeSessions(): SessionSlice[] {
  const base = new Date("2026-06-29T10:00:00Z"); // a Monday
  return [
    { area: "Money", currentState: "Stressed", score: 45, fearText: "not enough savings, might run out", createdAt: base },
    { area: "Money", currentState: "Hopeful", score: 55, fearText: "waiting for the perfect time", createdAt: new Date(base.getTime() + 86400_000) },
    { area: "Discipline", currentState: "Ready", score: 70, fearText: "I always quit after a week", createdAt: new Date(base.getTime() + 2 * 86400_000) },
    { area: "Money", currentState: "Grateful", score: 80, fearText: "less afraid this week", createdAt: new Date(base.getTime() + 3 * 86400_000) },
  ];
}

describe("weekStartOf", () => {
  it("returns the Monday of the containing week (UTC)", () => {
    expect(weekStartOf(new Date("2026-07-02T15:00:00Z")).toISOString()).toBe(
      "2026-06-29T00:00:00.000Z",
    );
    expect(weekStartOf(new Date("2026-06-29T00:00:00Z")).toISOString()).toBe(
      "2026-06-29T00:00:00.000Z",
    );
    // Sunday belongs to the week that started the previous Monday.
    expect(weekStartOf(new Date("2026-07-05T23:00:00Z")).toISOString()).toBe(
      "2026-06-29T00:00:00.000Z",
    );
  });
});

describe("pattern memory", () => {
  it("aggregates areas, states, themes, and trend", () => {
    const summary = buildPatternSummary(makeSessions());
    expect(summary.sessionsCount).toBe(4);
    expect(summary.averageScore).toBe(63);
    expect(summary.topAreas[0]).toEqual({ area: "Money", count: 3 });
    expect(summary.recurringFearThemes.length).toBeGreaterThan(0);
    expect(summary.scoreTrend).toBe("rising");
  });

  it("handles an empty history without inventing patterns", () => {
    const summary = buildPatternSummary([]);
    expect(summary.sessionsCount).toBe(0);
    expect(summary.scoreTrend).toBe("insufficient_data");
    expect(patternMemoryPrompt(summary)).toMatch(/first session/i);
  });

  it("produces a gentle, non-judgmental prompt for the voice coach", () => {
    const prompt = patternMemoryPrompt(buildPatternSummary(makeSessions()));
    expect(prompt).toMatch(/4 saved sessions/);
    expect(prompt).toMatch(/never as verdicts or blame/i);
  });
});

describe("weekly reports by tier", () => {
  const weekStart = weekStartOf(new Date("2026-07-02T00:00:00Z"));

  it("plus receives the basic summary", () => {
    const report = buildWeeklyReport({
      tier: "plus",
      weekStart,
      sessions: makeSessions(),
      habits: [],
    });
    expect(report.level).toBe("basic");
    expect(report.insights).not.toMatch(/Coach note/);
    expect(report.sessionsCount).toBe(4);
  });

  it("pro receives the advanced coach report with pattern memory and habit evidence", () => {
    const report = buildWeeklyReport({
      tier: "pro",
      weekStart,
      sessions: makeSessions(),
      habits: [{ habitName: "10-20-3 loop", logDates: [new Date(), new Date()] }],
    });
    expect(report.level).toBe("advanced");
    expect(report.insights).toMatch(/Coach note/);
    expect(report.insights).toMatch(/10-20-3 loop/);
  });

  it("an empty week produces an honest restart message, not fake stats", () => {
    const report = buildWeeklyReport({ tier: "plus", weekStart, sessions: [], habits: [] });
    expect(report.sessionsCount).toBe(0);
    expect(report.insights).toMatch(/No sessions this week/i);
  });
});
