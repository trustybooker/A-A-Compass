// A&A Compass v5 — pattern memory.
// Aggregates saved sessions into recurring themes. Plus sees basic summaries;
// Pro gets pattern memory that also feeds the voice coach and weekly reports.

export interface SessionSlice {
  area: string;
  currentState: string;
  score: number;
  fearText: string;
  createdAt: Date;
}

export interface PatternSummary {
  sessionsCount: number;
  averageScore: number;
  topAreas: Array<{ area: string; count: number }>;
  dominantStates: Array<{ state: string; count: number }>;
  recurringFearThemes: string[];
  scoreTrend: "rising" | "steady" | "falling" | "insufficient_data";
}

const FEAR_THEMES: Array<{ theme: string; pattern: RegExp }> = [
  { theme: "waiting for certainty before acting", pattern: /\b(certain|perfect|ready|right time|someday)\b/i },
  { theme: "fear of failure or judgment", pattern: /\b(fail|failure|judg|embarrass|laugh|reject)\b/i },
  { theme: "scarcity and not-enough thinking", pattern: /\b(not enough|scarcity|run out|broke|can'?t afford|lack)\b/i },
  { theme: "overwhelm and too many directions", pattern: /\b(overwhelm|too (much|many)|scattered|everywhere|burn(ed)? ?out)\b/i },
  { theme: "self-doubt about being capable", pattern: /\b(not (good|smart|talented) enough|imposter|who am i|doubt)\b/i },
  { theme: "past attempts that didn't hold", pattern: /\b(again|last time|always quit|never stick|relapse)\b/i },
];

function countBy<T>(items: T[], key: (item: T) => string): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildPatternSummary(sessions: SessionSlice[]): PatternSummary {
  if (sessions.length === 0) {
    return {
      sessionsCount: 0,
      averageScore: 0,
      topAreas: [],
      dominantStates: [],
      recurringFearThemes: [],
      scoreTrend: "insufficient_data",
    };
  }

  const sorted = [...sessions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const averageScore = Math.round(sorted.reduce((sum, s) => sum + s.score, 0) / sorted.length);

  const topAreas = countBy(sorted, (s) => s.area)
    .slice(0, 3)
    .map(({ name, count }) => ({ area: name, count }));
  const dominantStates = countBy(sorted, (s) => s.currentState)
    .slice(0, 3)
    .map(({ name, count }) => ({ state: name, count }));

  const allFearText = sorted.map((s) => s.fearText).join("\n");
  const recurringFearThemes = FEAR_THEMES.filter(({ pattern }) => pattern.test(allFearText)).map(
    ({ theme }) => theme,
  );

  let scoreTrend: PatternSummary["scoreTrend"] = "insufficient_data";
  if (sorted.length >= 4) {
    const half = Math.floor(sorted.length / 2);
    const firstAvg = sorted.slice(0, half).reduce((sum, s) => sum + s.score, 0) / half;
    const lastAvg =
      sorted.slice(-half).reduce((sum, s) => sum + s.score, 0) / half;
    if (lastAvg - firstAvg > 4) scoreTrend = "rising";
    else if (firstAvg - lastAvg > 4) scoreTrend = "falling";
    else scoreTrend = "steady";
  }

  return {
    sessionsCount: sorted.length,
    averageScore,
    topAreas,
    dominantStates,
    recurringFearThemes,
    scoreTrend,
  };
}

/** Compact context string for the Pro voice coach (pattern memory). */
export function patternMemoryPrompt(summary: PatternSummary): string {
  if (summary.sessionsCount === 0) {
    return "No prior session history. This may be the user's first session — start with awareness.";
  }
  const areas = summary.topAreas.map((a) => a.area).join(", ") || "varied areas";
  const states = summary.dominantStates.map((s) => s.state.toLowerCase()).join(", ") || "varied states";
  const fears = summary.recurringFearThemes.length
    ? `Recurring misalignment themes: ${summary.recurringFearThemes.join("; ")}.`
    : "No strong recurring fear theme detected yet.";
  return [
    `The user has ${summary.sessionsCount} saved sessions, average alignment score ${summary.averageScore}/100 (trend: ${summary.scoreTrend}).`,
    `They return most often to: ${areas}. Typical starting states: ${states}.`,
    fears,
    "Use this history gently — reflect patterns as observations, never as verdicts or blame.",
  ].join(" ");
}
