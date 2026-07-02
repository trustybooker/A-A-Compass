// A&A Compass v5 — weekly reports.
// Plus receives a basic pattern summary; Pro receives the advanced coach report
// (docs/AA_Compass_v5_Tier_Access_Matrix.md).

import { buildPatternSummary, type PatternSummary, type SessionSlice } from "@/lib/patterns";
import type { TierId } from "@/lib/tiers";
import { hasFeature } from "@/lib/tiers";

export interface HabitSlice {
  habitName: string;
  logDates: Date[];
}

export interface WeeklyReportData {
  weekStart: Date;
  weekEnd: Date;
  tier: TierId;
  level: "basic" | "advanced";
  sessionsCount: number;
  averageScore: number;
  topAreas: string;
  patterns: PatternSummary;
  insights: string;
}

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStartOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function basicInsights(patterns: PatternSummary): string {
  if (patterns.sessionsCount === 0) {
    return "No sessions this week. One honest session is enough to restart the rhythm — begin with what is true right now.";
  }
  const lines = [
    `You completed ${patterns.sessionsCount} session${patterns.sessionsCount === 1 ? "" : "s"} this week with an average alignment score of ${patterns.averageScore}/100.`,
  ];
  if (patterns.topAreas.length > 0) {
    lines.push(`Your attention kept returning to ${patterns.topAreas.map((a) => a.area).join(" and ")}.`);
  }
  if (patterns.recurringFearThemes.length > 0) {
    lines.push(`A pattern worth watching: ${patterns.recurringFearThemes[0]}.`);
  }
  lines.push("Keep the loop small: one action, one habit check, one gratitude, one act of service.");
  return lines.join("\n");
}

function advancedInsights(patterns: PatternSummary, habits: HabitSlice[]): string {
  const lines = [basicInsights(patterns)];
  if (patterns.scoreTrend === "rising") {
    lines.push(
      "Coach note: your alignment scores are trending up. Protect the habit loop that produced this — do not add new commitments yet; compound the one that is working.",
    );
  } else if (patterns.scoreTrend === "falling") {
    lines.push(
      "Coach note: your scores dipped this week. That is information, not failure. Shrink the aligned action until it is small enough to complete on your hardest day.",
    );
  } else if (patterns.scoreTrend === "steady") {
    lines.push(
      "Coach note: steady scores suggest a stable rhythm. This is the right week to deepen one area rather than widen many.",
    );
  }
  if (patterns.recurringFearThemes.length > 1) {
    lines.push(
      `Pattern memory: multiple recurring themes are active (${patterns.recurringFearThemes.join("; ")}). Bring the loudest one into your next voice session and let the coach walk the Fear Release mode with you.`,
    );
  }
  const activeHabits = habits.filter((h) => h.logDates.length > 0);
  if (activeHabits.length > 0) {
    const best = [...activeHabits].sort((a, b) => b.logDates.length - a.logDates.length)[0];
    lines.push(
      `Habit evidence: "${best.habitName}" was logged ${best.logDates.length} time${best.logDates.length === 1 ? "" : "s"} this week — that is proof of self-trust accumulating.`,
    );
  } else if (habits.length > 0) {
    lines.push("Habit evidence: no habit logs this week. Choose the smallest habit and log it once today.");
  }
  lines.push(
    "Next week's aim: carry one definite vision, one habit loop, and one service action into each day. Results come from your actions and circumstances — the compass only keeps them aligned.",
  );
  return lines.join("\n");
}

export function buildWeeklyReport(params: {
  tier: TierId;
  weekStart: Date;
  sessions: SessionSlice[];
  habits: HabitSlice[];
}): WeeklyReportData {
  const { tier, weekStart, sessions, habits } = params;
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const patterns = buildPatternSummary(sessions);
  const advanced = hasFeature(tier, "weekly_report_advanced");
  return {
    weekStart,
    weekEnd,
    tier,
    level: advanced ? "advanced" : "basic",
    sessionsCount: patterns.sessionsCount,
    averageScore: patterns.averageScore,
    topAreas: patterns.topAreas.map((a) => a.area).join(", "),
    patterns,
    insights: advanced ? advancedInsights(patterns, habits) : basicInsights(patterns),
  };
}
