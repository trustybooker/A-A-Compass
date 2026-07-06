// A&A Compass v5 — the 6A Engine with the internal Boss Skill achievement layer.
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
// Boss Skill is an internal operator name only. The app must not surface that
// name to members; user-facing language stays A&A Compass / Sovereign Achievement.
// The layer adds visible achievement, discernment, and proof-signal outputs.
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
  /**
   * Anchors phrasing variety. Readings are deterministic for the same
   * inputs on the same day, but rotate wording across days so a daily
   * practice stays fresh. Defaults to now.
   */
  seedDate?: Date;
}

/** The eight required outputs, plus score/mode/plans and visible achievement proof. */
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
  achievementTarget: string;
  decisionRule: string;
  proofSignal: string;
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

// Two grounded actions per area; the day seed picks one so a daily practice
// doesn't repeat yesterday's assignment verbatim.
const AREA_ACTIONS: Record<Area, [string, string]> = {
  Money: [
    "Write down your three next money-related decisions, pick the one you can complete today, and finish it before the day ends.",
    "Spend 20 minutes today facing one money fact you've been avoiding — a balance, a bill, a price — and write down the single next step it asks of you.",
  ],
  Business: [
    "Make one concrete offer, follow-up, or improvement to a customer-facing piece of your business today.",
    "Contact one real person today who could use what you offer, and ask one honest question about what they need.",
  ],
  Purpose: [
    "Spend 20 focused minutes today on the one activity that feels most like contribution, and finish a small visible piece of it.",
    "Write one paragraph today about the person you are becoming, then do the smallest visible thing that person would do before sunset.",
  ],
  Peace: [
    "Choose one recurring stressor, and take one concrete step today to shrink it — a boundary, a conversation, or a 15-minute reset ritual.",
    "Give yourself one 15-minute block of full quiet today — no input, no screen — and write down the one thought that kept returning.",
  ],
  Discipline: [
    "Pick the smallest promise you have been breaking to yourself and keep it once today, fully and on time.",
    "Choose tonight's shutdown time now, write it where you'll see it, and keep it — discipline starts with endings, not beginnings.",
  ],
  Relationships: [
    "Reach out to one person who matters and offer honest appreciation or a repair — one message or one conversation today.",
    "Ask one person you care about a real question today, and listen to the whole answer without planning your reply.",
  ],
  Creativity: [
    "Create for 25 minutes today without editing or judging, and save whatever you make as proof of motion.",
    "Finish one tiny creative piece today — imperfect and complete beats perfect and imaginary.",
  ],
  Service: [
    "Do one act of service today that costs you something real — time, skill, or attention — for someone who cannot immediately repay it.",
    "Notice one struggle around you today and quietly make it lighter — no announcement, no credit.",
  ],
};

// Rotating phrasing pools. Every variant must satisfy the claims filter —
// tests iterate all of them across areas, tiers, and seed days.
const VISION_VARIANTS = [
  "I am becoming a person who thinks deliberately, imagines clearly, acts consistently, gives thanks daily, and uses progress to increase life for myself and others.",
  "I am becoming someone whose thoughts have direction, whose actions keep promises, and whose progress makes life larger for the people around me.",
  "I am becoming a person who chooses clarity over noise, one faithful action over perfect plans, and gratitude over grasping — today, not someday.",
  "I am becoming steady: clear in aim, honest about fear, consistent in action, generous in increase.",
] as const;

const TRUTH_CLOSERS = [
  "The desire is real, but it needs direction, action, habit, gratitude, and service to become useful.",
  "Nothing is wrong with wanting this — the work is giving it direction, one action, one habit, and a way to serve.",
  "This desire has been waiting for structure, not permission: a clear aim, a small action, a repeatable loop.",
] as const;

const HABIT_LOOP_VARIANTS = [
  "For the next 7 days: 10 minutes of alignment (read your vision and truth reflection), 20 minutes of focused action on this desire, 3 minutes of gratitude review before sleep.",
  "For the next 7 days, anchor the morning: read your vision before anything else, take one 20-minute action before noon, and close the day naming one thing that moved.",
  "For the next 7 days, keep the 10-20-3 loop: 10 minutes of alignment when you wake, 20 minutes of undistracted action at a fixed time, 3 minutes of gratitude before sleep.",
] as const;

const GRATITUDE_TEMPLATES: ReadonlyArray<(gratitude: string) => string> = [
  (g) => `I give thanks for ${g}. I do not need the whole path to act faithfully today.`,
  (g) => `Today I am grateful for ${g} — and gratitude widens what I can see, so I look again before I act.`,
  (g) => `I give thanks for ${g}. What I appreciate, I stop taking for granted — and what I stop taking for granted, I can build on.`,
];

const SERVICE_VARIANTS = [
  "Help one person today with clarity, encouragement, a useful resource, a better offer, or a solved problem — increase life somewhere beyond yourself.",
  "Before the day ends, make one thing easier for one person — a question answered, a door opened, a burden shared.",
  "Give something useful away today: fifteen minutes of real attention, a skill, an introduction, or honest encouragement.",
  "Leave one corner of someone's day better than you found it — quietly, concretely, today.",
] as const;

const PROOF_SIGNALS: Record<Area, [string, string]> = {
  Money: [
    "Save a short note, screenshot, or checklist showing the money fact you faced and the next decision you chose.",
    "Create a one-line proof note: the balance, bill, price, or plan you clarified today and what you will do next.",
  ],
  Business: [
    "Capture the offer, message, page, demo, or follow-up you improved so reputation has something real to travel with.",
    "Save or share one useful business proof: a screenshot, short post, offer draft, client note, or before/after improvement.",
  ],
  Purpose: [
    "Save the paragraph, page, outline, or small visible piece that proves purpose moved from thought into form.",
    "Write a one-sentence completion note that names what you made, who it can help, and the next faithful action.",
  ],
  Peace: [
    "Record the boundary, reset, or quiet block you completed and the one stressor it reduced.",
    "Save a short before/after note showing what felt noisy before and what became clearer after the action.",
  ],
  Discipline: [
    "Mark the promise kept, with the exact time and evidence that you completed it instead of negotiating with it.",
    "Save proof of completion: a checked box, timestamp, finished task, or short note that your word held today.",
  ],
  Relationships: [
    "Save the message, repair, appreciation, or listening action you completed without exposing private details.",
    "Write a private proof note: who you honored, what you said or asked, and how you protected dignity.",
  ],
  Creativity: [
    "Save the draft, sketch, recording, paragraph, design, or screenshot as proof that the idea entered the world.",
    "Create a before/after or work-in-progress proof signal that shows motion, not perfection.",
  ],
  Service: [
    "Save a private note naming the service action, who it helped, and what became lighter because you acted.",
    "Capture the resource, answer, introduction, or burden-lifting action you gave without turning it into performance.",
  ],
};

const DECISION_RULES: Record<Area, string> = {
  Money: "Do not chase a money move today unless it creates clarity, lowers pressure, prevents a leak, or supports a real next action.",
  Business: "Do not chase an opportunity today unless it improves the offer, reaches a real person, or creates visible trust.",
  Purpose: "Do not chase inspiration today unless it becomes a finished sentence, draft, decision, or useful act.",
  Peace: "Do not chase relief today if it creates a bigger problem tomorrow; choose the calm action that also creates order.",
  Discipline: "Do not chase intensity today; choose the smallest promise you can keep fully and on time.",
  Relationships: "Do not chase approval today; choose honesty, repair, listening, or a clean boundary.",
  Creativity: "Do not chase perfect taste today; choose one imperfect finished piece that can be improved later.",
  Service: "Do not chase recognition today; choose the useful action that increases life whether or not anyone applauds.",
};

/** Small stable string hash for seeded variant selection. */
function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(seed: number, salt: number, pool: ReadonlyArray<T>): T {
  return pool[(seed + salt) % pool.length];
}

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
    "7-day Sovereign Achievement rhythm:",
    "Day 1: name the desire and the impulse that tries to rule it.",
    "Day 2: order one area that is leaking time, money, focus, or trust.",
    "Day 3: replace one weak phrase with a truthful command you can act on.",
    "Day 4: cut one distraction, false opportunity, or boundary leak.",
    `Day 5: complete one useful ${area.toLowerCase()} asset, decision, message, or improvement.`,
    "Day 6: create one proof signal that can travel farther than your explanation.",
    "Day 7: review what was completed, what was missed, and the next 7-day aim.",
  ].join("\n");
}

function build30DayPlan(area: Area, advanced: boolean): string {
  const base = [
    "30-day achievement arc:",
    "Week 1: run the daily loop and keep every small promise you set.",
    `Week 2: double down on the one ${area.toLowerCase()} action producing visible evidence; remove one distraction.`,
    "Week 3: create a proof signal each day: screenshot, note, draft, offer, lesson, message, or completed step.",
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

  // Deterministic for the same inputs on the same day; wording rotates across
  // days so a daily practice never gets yesterday's sentences back.
  const dayKey = (input.seedDate ?? new Date()).toISOString().slice(0, 10);
  const seed = hashSeed(`${dayKey}|${input.area}|${input.state}`);

  const modeNote =
    input.coachingMode && hasFeature(input.tier, "advanced_modes")
      ? MODE_EMPHASIS[input.coachingMode]
      : undefined;

  const truthReflection = [
    `You are not only asking for ${areaLower}. You are asking for a clearer inner pattern and a stronger outer rhythm.`,
    `Right now you feel ${input.state.toLowerCase()}, and that is a fact to work with, not a verdict.`,
    pick(seed, 1, TRUTH_CLOSERS),
    modeNote,
  ]
    .filter(Boolean)
    .join(" ");

  const deeperValue = `Under this desire is ${DEEPER_VALUES[input.area]}.`;

  const misalignmentToRelease = `Release the pattern of ${fear}. Name it, learn what it was protecting, and then stop letting it choose your next action.`;

  const definiteVision = pick(seed, 2, VISION_VARIANTS);

  const alignedAction = pick(seed, 3, AREA_ACTIONS[input.area]);

  const habitLoop = pick(seed, 4, HABIT_LOOP_VARIANTS);

  const gratitudeAnchor = pick(seed, 5, GRATITUDE_TEMPLATES)(gratitude);

  const serviceAction = pick(seed, 6, SERVICE_VARIANTS);

  const achievementTarget = `Within the next 24 hours, complete one visible ${areaLower} achievement: ${alignedAction.replace(/\.$/, "")}.`;

  const decisionRule = DECISION_RULES[input.area];

  const proofSignal = pick(seed, 7, PROOF_SIGNALS[input.area]);

  const plan24Hour = [
    "Morning: name the desire, read the gratitude anchor out loud, and choose the exact time block for the aligned action.",
    "Midday: complete the aligned action and capture the proof signal before moving to the next task.",
    "Night: record what was completed, what changed, what proof exists, and the next faithful action for tomorrow.",
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
    ["Today's visible achievement", achievementTarget],
    ["One aligned action today", alignedAction],
    ["Discernment rule", decisionRule],
    ["Proof signal", proofSignal],
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
    achievementTarget,
    decisionRule,
    proofSignal,
    plan24Hour,
    plan7Day,
    plan30Day,
    fullText,
  };
}
