// A&A Compass v5 — the 6A Engine.
// Source of truth: docs/AA_Compass_v5_Skill_System_Prompt.md and
// docs/AA_Compass_v5_Production_Build_Spec.md.
//
// 1. Awareness     — reflect what is true right now.
// 2. Alignment     — identify fear, contradiction, or misalignment.
// 3. Aim           — form a definite vision.
// 4. Action        — choose one grounded action.
// 5. Accumulation  — create one habit loop.
// 6. Abundance     — connect the desire to service and value for others.
//
// Every reading MUST include the eight required outputs. This engine is
// deterministic so that outcome guarantees hold without any AI dependency;
// safety filters still run over its output as a hard backstop.

import { enforceOutputClaims } from "@/lib/safety";
import type { TierId } from "@/lib/tiers";
import { hasFeature } from "@/lib/tiers";

export const AREAS = [
  "Money",
  "Business",
  "Purpose",
  "Peace",
  "Discipline",
  "Relationships",
  "Creativity",
  "Service",
] as const;
export type Area = (typeof AREAS)[number];

export const STATES = [
  "Stressed",
  "Stuck",
  "Tired",
  "Hopeful",
  "Grateful",
  "Inspired",
  "Ready",
] as const;
export type CurrentState = (typeof STATES)[number];

/** Advanced guided modes — Pro only (docs/AA_Compass_v5_Production_Build_Spec.md). */
export const ADVANCED_MODES = [
  "Money",
  "Business",
  "Purpose",
  "Discipline",
  "Peace",
  "Fear Release",
  "Gratitude",
  "Night Review",
] as const;
export type AdvancedMode = (typeof ADVANCED_MODES)[number];

export interface CompassInput {
  area: Area;
  state: CurrentState;
  desire: string;
  fear: string;
  gratitude: string;
  tier: TierId;
  coachingMode?: AdvancedMode;
}

/** The eight required outputs, plus score/mode/plans. */
export interface CompassReading {
  score: number;
  alignmentMode: string;
  area: Area;
  state: CurrentState;
  coachingMode?: AdvancedMode;
  truthReflection: string;
  deeperValue: string;
  misalignmentToRelease: string;
  definiteVision: string;
  alignedAction: string;
  habitLoop: string;
  gratitudeAnchor: string;
  serviceAction: string;
  plan24Hour: string;
  plan7Day?: string;
  plan30Day?: string;
  fullText: string;
}

export const REQUIRED_OUTPUT_KEYS = [
  "truthReflection",
  "deeperValue",
  "misalignmentToRelease",
  "definiteVision",
  "alignedAction",
  "habitLoop",
  "gratitudeAnchor",
  "serviceAction",
] as const satisfies ReadonlyArray<keyof CompassReading>;

const DEEPER_VALUES: Record<Area, string> = {
  Money: "safety, freedom, stability, choice, and the ability to create without panic",
  Business: "useful value, visibility, trust, service, and consistent offers",
  Purpose: "meaning, direction, identity, contribution, and daily courage",
  Peace: "inner stability, space to think, and a nervous system that can act with clarity",
  Discipline: "self-trust, completion, rhythm, and proof that you can keep promises to yourself",
  Relationships: "love, understanding, communication, forgiveness, and safer connection",
  Creativity: "expression, originality, courage, and bringing invisible ideas into useful form",
  Service: "increase, contribution, generosity, and making life better for others",
};

const AREA_ACTIONS: Record<Area, string> = {
  Money: "Write down your three next money-related decisions, pick the one you can complete today, and finish it before the day ends.",
  Business: "Make one concrete offer, follow-up, or improvement to a customer-facing piece of your business today.",
  Purpose: "Spend 20 focused minutes today on the one activity that feels most like contribution, and finish a small visible piece of it.",
  Peace: "Choose one recurring stressor, and take one concrete step today to shrink it — a boundary, a conversation, or a 15-minute reset ritual.",
  Discipline: "Pick the smallest promise you have been breaking to yourself and keep it once today, fully and on time.",
  Relationships: "Reach out to one person who matters and offer honest appreciation or a repair — one message or one conversation today.",
  Creativity: "Create for 25 minutes today without editing or judging, and save whatever you make as proof of motion.",
  Service: "Do one act of service today that costs you something real — time, skill, or attention — for someone who cannot immediately repay it.",
};

const MODE_EMPHASIS: Record<AdvancedMode, string> = {
  Money: "This session runs in Money mode: watch for scarcity stories and let value-creation lead.",
  Business: "This session runs in Business mode: focus on offers, service, and consistent visible value.",
  Purpose: "This session runs in Purpose mode: direction matters more than speed today.",
  Discipline: "This session runs in Discipline mode: one kept promise is worth more than ten plans.",
  Peace: "This session runs in Peace mode: a calm nervous system is the foundation of every other gain.",
  "Fear Release": "This session runs in Fear Release mode: name the fear precisely, learn its lesson, and act anyway — small and today.",
  Gratitude: "This session runs in Gratitude mode: let appreciation widen what you can see before you choose the next step.",
  "Night Review": "This session runs in Night Review mode: review the day without judgment — what happened, what it taught, what you will repeat tomorrow.",
};

export function scoreSession(input: Pick<CompassInput, "state" | "desire" | "fear" | "gratitude">): number {
  let score = 45;
  if (["Grateful", "Inspired", "Ready", "Hopeful"].includes(input.state)) score += 10;
  if (input.desire.trim().length > 40) score += 10;
  if (input.fear.trim().length > 10) score += 10;
  if (input.gratitude.trim().length > 10) score += 15;
  return Math.min(100, Math.max(20, score));
}

export function modeFromScore(score: number): string {
  if (score < 40) return "Reset Mode";
  if (score < 55) return "Clarity Mode";
  if (score < 70) return "Alignment Mode";
  if (score < 85) return "Act & Build Mode";
  return "Multiply & Serve Mode";
}

function normalize(text: string | undefined | null, fallback: string): string {
  const trimmed = (text ?? "").trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function build7DayPlan(area: Area): string {
  return [
    "7-day rhythm:",
    "Day 1-2: 10 minutes of alignment (truth + vision), 20 minutes of focused action, 3 minutes of gratitude review.",
    `Day 3-4: repeat the loop and add one ${area.toLowerCase()}-specific action from this reading.`,
    "Day 5: review what worked, drop what didn't, and write one sentence of evidence that you moved.",
    "Day 6: one act of service connected to this desire.",
    "Day 7: rest, gratitude review, and set the single aim for next week.",
  ].join("\n");
}

function build30DayPlan(area: Area, advanced: boolean): string {
  const base = [
    "30-day arc:",
    "Week 1: run the daily loop (alignment, action, gratitude) and keep every small promise you set.",
    `Week 2: double down on the one ${area.toLowerCase()} action producing visible evidence; remove one distraction.`,
    "Week 3: add one act of service or increase for someone else each day, however small.",
    "Week 4: review the month honestly — what compounded, what to release — and choose the next definite aim.",
  ];
  if (advanced) {
    base.push(
      "Advanced (Pro): bring this plan into your voice coaching sessions each week; your coach will track the pattern across sessions and adjust the plan with you.",
    );
  }
  return base.join("\n");
}

/**
 * Generate a Compass Reading. Deterministic, always contains the eight
 * required outputs, and runs the prohibited-claims filter as a final gate.
 */
export function generateReading(input: CompassInput): CompassReading {
  const desire = normalize(input.desire, "I want clarity, momentum, and a life that creates more value.");
  const fear = normalize(input.fear, "waiting for perfect certainty before taking the next step");
  const gratitude = normalize(
    input.gratitude,
    "life, awareness, the ability to choose again, and the next right action",
  );

  const score = scoreSession({ state: input.state, desire, fear, gratitude });
  const alignmentMode = modeFromScore(score);
  const areaLower = input.area.toLowerCase();

  const modeNote =
    input.coachingMode && hasFeature(input.tier, "advanced_modes")
      ? MODE_EMPHASIS[input.coachingMode]
      : undefined;

  const truthReflection = [
    `You are not only asking for ${areaLower}. You are asking for a clearer inner pattern and a stronger outer rhythm.`,
    `Right now you feel ${input.state.toLowerCase()}, and that is a fact to work with, not a verdict.`,
    "The desire is real, but it needs direction, action, habit, gratitude, and service to become useful.",
    modeNote,
  ]
    .filter(Boolean)
    .join(" ");

  const deeperValue = `Under this desire is ${DEEPER_VALUES[input.area]}.`;

  const misalignmentToRelease = `Release the pattern of ${fear}. Name it, learn what it was protecting, and then stop letting it choose your next action.`;

  const definiteVision =
    "I am becoming a person who thinks deliberately, imagines clearly, acts consistently, gives thanks daily, and uses progress to increase life for myself and others.";

  const alignedAction = AREA_ACTIONS[input.area];

  const habitLoop =
    "For the next 7 days: 10 minutes of alignment (read your vision and truth reflection), 20 minutes of focused action on this desire, 3 minutes of gratitude review before sleep.";

  const gratitudeAnchor = `I give thanks for ${gratitude}. I do not need the whole path to act faithfully today.`;

  const serviceAction =
    "Help one person today with clarity, encouragement, a useful resource, a better offer, or a solved problem — increase life somewhere beyond yourself.";

  const plan24Hour = [
    "Morning: name the desire and read the gratitude anchor out loud.",
    "Midday: complete the aligned action.",
    "Night: record what changed, what you learned, and what you will repeat tomorrow.",
  ].join("\n");

  const plan7Day = hasFeature(input.tier, "plan_7day") ? build7DayPlan(input.area) : undefined;
  const plan30Day = hasFeature(input.tier, "plan_30day")
    ? build30DayPlan(input.area, hasFeature(input.tier, "advanced_modes"))
    : undefined;

  const sections: Array<[string, string]> = [
    ["Truth reflection", truthReflection],
    ["Deeper value", deeperValue],
    ["Misalignment to release", misalignmentToRelease],
    ["Definite vision", definiteVision],
    ["One aligned action today", alignedAction],
    ["One habit loop", habitLoop],
    ["Gratitude anchor", gratitudeAnchor],
    ["Service / increase-life action", serviceAction],
    ["24-hour plan", plan24Hour],
  ];
  if (plan7Day) sections.push(["7-day plan", plan7Day]);
  if (plan30Day) sections.push(["30-day plan", plan30Day]);
  sections.push(["Original desire", desire]);

  const header = [
    "Your A&A Compass Reading",
    "",
    `Alignment mode: ${alignmentMode}`,
    `Score: ${score}/100`,
    `Area: ${input.area}`,
    `Current state: ${input.state}`,
    input.coachingMode && modeNote ? `Coaching mode: ${input.coachingMode}` : undefined,
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  const rawFullText = [header, "", ...sections.map(([title, body]) => `${title}:\n${body}`)].join("\n\n");
  // Hard safety gate: no reading ships with a prohibited claim.
  const { text: fullText } = enforceOutputClaims(rawFullText);

  return {
    score,
    alignmentMode,
    area: input.area,
    state: input.state,
    coachingMode: modeNote ? input.coachingMode : undefined,
    truthReflection,
    deeperValue,
    misalignmentToRelease,
    definiteVision,
    alignedAction,
    habitLoop,
    gratitudeAnchor,
    serviceAction,
    plan24Hour,
    plan7Day,
    plan30Day,
    fullText,
  };
}
