// A&A Compass v5 — safety guardrails.
// Source of truth: docs/AA_Compass_v5_Skill_System_Prompt.md ("Never" list) and
// docs/AA_Compass_v5_Production_Build_Spec.md ("What it is not").
//
// The app must never promise guaranteed income, healing, or manifestation,
// never replace therapy/medical/legal/financial advice, never blame users for
// hardship, and never build dependency or use coercive religious framing.

export type SafetyConcern =
  | "crisis"
  | "medical"
  | "legal"
  | "financial_advice"
  | "manipulative"
  | "none";

export interface SafetyCheck {
  concern: SafetyConcern;
  /** When concern !== "none", a safe, supportive response to show instead of a normal reading. */
  response?: string;
}

const CRISIS_PATTERNS: RegExp[] = [
  /\b(suicid\w*|kill(ing)? myself|end(ing)? my life|end it all|self[- ]harm|hurt(ing)? myself|cutting myself)\b/i,
  /\b(don'?t want to (live|be alive|be here)|no reason to live|better off dead)\b/i,
  /\b(overdose|take my own life)\b/i,
];

const MEDICAL_PATTERNS: RegExp[] = [
  /\b(diagnos\w+|prescri\w+|medication dosage|stop taking my (meds|medication)|cure my (illness|disease|cancer|diabetes)|treat my (condition|illness|disease))\b/i,
  /\bshould i (stop|start) (taking|using) .*(medication|meds|insulin|antidepressant)/i,
];

const LEGAL_PATTERNS: RegExp[] = [
  /\b(sue|lawsuit|legal advice|is it legal|custody battle|sign this contract|criminal charge)\b/i,
];

const FINANCIAL_ADVICE_PATTERNS: RegExp[] = [
  /\b(which (stock|stocks|crypto|coin|token)s? (should|do) i buy|guaranteed return|invest my (savings|401k|pension)|financial advice|pick (a|the best) (stock|investment))\b/i,
];

const MANIPULATIVE_PATTERNS: RegExp[] = [
  /\b(manipulat\w+ (someone|him|her|them|people|my)|make (someone|him|her|them) (love|obey|depend)|pressure (them|him|her|someone) into|control (my|another) (partner|spouse|client)s?)\b/i,
  /\b(get (someone|him|her|them) to give me (their )?money|exploit (their|his|her|someone'?s))\b/i,
];

export const CRISIS_RESPONSE = [
  "Thank you for telling me something this heavy. What you are feeling matters, and you deserve real support from a trained person right now — more than a coaching reading.",
  "",
  "A&A Compass is a coaching tool, not therapy or crisis care.",
  "",
  "If you are in immediate danger, please call your local emergency number now.",
  "In the US: call or text 988 (Suicide & Crisis Lifeline) — available 24/7.",
  "Outside the US: https://findahelpline.com lists free, confidential helplines by country.",
  "",
  "If you can, reach out to one person you trust and tell them how you are feeling today. You do not have to carry this alone, and asking for help is a strong, aligned action.",
].join("\n");

export const MEDICAL_BOUNDARY_RESPONSE = [
  "I can't help with medical decisions — A&A Compass is a coaching tool, not medical care, and it would be wrong for me to pretend otherwise.",
  "",
  "For anything involving diagnosis, medication, or treatment, please talk with a licensed medical professional.",
  "",
  "What I can do is coach you on the alignment side: how you want to show up while you work with your care team, what habit supports your health plan, and what one grounded step you can take today. If you'd like that, tell me what you're navigating in your own words.",
].join("\n");

export const LEGAL_BOUNDARY_RESPONSE = [
  "I can't give legal advice — A&A Compass is a coaching tool, not a law practice.",
  "",
  "For contracts, disputes, or anything with legal consequences, please consult a qualified attorney.",
  "",
  "What I can help with is clarity: what outcome you actually want, what fear is driving urgency, and what one grounded, non-legal step (like gathering documents or booking a consultation) you can take today.",
].join("\n");

export const FINANCIAL_BOUNDARY_RESPONSE = [
  "I can't tell you what to invest in or promise any financial outcome — A&A Compass is a coaching tool, not a financial advisor, and no honest coach can guarantee returns.",
  "",
  "For investment decisions, please work with a licensed financial professional.",
  "",
  "What I can help with is the alignment underneath money: the deeper value you're really seeking (safety, freedom, choice), the habit that builds financial steadiness, and one grounded action — like tracking spending for a week or booking time with a fiduciary advisor.",
].join("\n");

export const MANIPULATIVE_REFUSAL_RESPONSE = [
  "I won't help with that. A&A Compass exists to increase life for you and for others — never to pressure, manipulate, or control anyone.",
  "",
  "Real prosperity is built on service and honest value, and every outcome this coach produces must respect other people's autonomy the same way it protects yours.",
  "",
  "If you'd like, we can look at what you genuinely want underneath this — influence, security, connection — and find an aligned way to build it that leaves everyone better off.",
].join("\n");

/** Classify user input BEFORE generating a reading. */
export function classifyInput(text: string): SafetyCheck {
  if (CRISIS_PATTERNS.some((p) => p.test(text))) {
    return { concern: "crisis", response: CRISIS_RESPONSE };
  }
  if (MANIPULATIVE_PATTERNS.some((p) => p.test(text))) {
    return { concern: "manipulative", response: MANIPULATIVE_REFUSAL_RESPONSE };
  }
  if (MEDICAL_PATTERNS.some((p) => p.test(text))) {
    return { concern: "medical", response: MEDICAL_BOUNDARY_RESPONSE };
  }
  if (LEGAL_PATTERNS.some((p) => p.test(text))) {
    return { concern: "legal", response: LEGAL_BOUNDARY_RESPONSE };
  }
  if (FINANCIAL_ADVICE_PATTERNS.some((p) => p.test(text))) {
    return { concern: "financial_advice", response: FINANCIAL_BOUNDARY_RESPONSE };
  }
  return { concern: "none" };
}

// ---------------------------------------------------------------------------
// Output claim filter — no generated output may ship a prohibited claim.
// ---------------------------------------------------------------------------

export type ClaimViolation =
  | "guaranteed_income"
  | "guaranteed_healing"
  | "guaranteed_manifestation"
  | "professional_advice_claim"
  | "dependency_language"
  | "blame_language";

const CLAIM_PATTERNS: Array<{ violation: ClaimViolation; pattern: RegExp }> = [
  { violation: "guaranteed_income", pattern: /\bguarantee[ds]?\b.{0,40}\b(income|money|wealth|riches|profit|earnings)\b/i },
  { violation: "guaranteed_income", pattern: /\b(you will|you'll) (definitely |certainly )?(be|get|become) rich\b/i },
  { violation: "guaranteed_healing", pattern: /\b(will|guarantee[ds]? to) (cure|heal) (you|your)\b/i },
  { violation: "guaranteed_manifestation", pattern: /\bguarantee[ds]?\b.{0,40}\bmanifest/i },
  { violation: "guaranteed_manifestation", pattern: /\bthe universe (must|will always|is required to) (deliver|provide|give)\b/i },
  { violation: "professional_advice_claim", pattern: /\b(this is|consider this|take this as) (medical|legal|financial|therapeutic) advice\b/i },
  { violation: "professional_advice_claim", pattern: /\byou (don'?t|do not) need (a|your) (doctor|therapist|lawyer|financial advisor)\b/i },
  { violation: "dependency_language", pattern: /\b(only (this coach|A&A Compass) can|you cannot (succeed|grow|do this) without (me|this app|this coach)|never stop (using|paying for) )/i },
  { violation: "blame_language", pattern: /\b(your (poverty|illness|hardship|suffering) is your (own )?fault|you attracted (this|your) (illness|poverty|hardship))\b/i },
];

export interface ClaimCheck {
  ok: boolean;
  violations: ClaimViolation[];
}

/**
 * Disclaimers legitimately mention prohibited claims in the negative
 * ("never promises guaranteed income", "no honest coach can guarantee
 * returns"). Strip those negated clauses before scanning so denials pass
 * while actual promises are still caught.
 */
const NEGATED_CLAIM_CLAUSE =
  /\b(never|not|no|nothing|doesn'?t|does not|do(?:es)? not|don'?t|cannot|can'?t|won'?t|without)\b(?:\s+\w+){0,3}\s+(promis\w*|guarantee\w*)\b[^.!?\n]*/gi;

/** Scan generated output for prohibited claims. Used as a post-filter on all coach output. */
export function checkOutputClaims(text: string): ClaimCheck {
  const scrubbed = text.replace(NEGATED_CLAIM_CLAUSE, " ");
  const violations = CLAIM_PATTERNS.filter(({ pattern }) => pattern.test(scrubbed)).map(
    ({ violation }) => violation,
  );
  return { ok: violations.length === 0, violations: [...new Set(violations)] };
}

export const SAFE_CORRECTION =
  "A&A Compass never promises guaranteed income, healing, or outcomes. What it offers is a truthful process: clarity, one grounded action, a habit that compounds, gratitude, and service. Results depend on your circumstances and your actions.";

/**
 * Replace any output that fails the claim filter with a safe corrected framing.
 * Deterministic engine output should never trip this; it exists as a hard
 * guarantee over any AI-augmented or voice-transcribed content.
 */
export function enforceOutputClaims(text: string): { text: string; check: ClaimCheck } {
  const check = checkOutputClaims(text);
  if (check.ok) return { text, check };
  return { text: SAFE_CORRECTION, check };
}

export const GLOBAL_DISCLAIMER =
  "A&A Compass is a coaching tool for clarity, habit, and aligned action. It is not therapy, medical care, legal counsel, or financial advice, and it never guarantees income, healing, or outcomes.";
