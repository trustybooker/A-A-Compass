// A&A Compass v5 — public tiers and entitlements.
// Source of truth: docs/AA_Compass_v5_Tier_Access_Matrix.md and docs/AA_Compass_v5_Tool_Logic.json.
// There are exactly three public tiers at launch. Certification is NOT a fourth
// public tier — it is a gated pathway inside Pro that requires approval.

export type TierId = "free" | "plus" | "pro";

export const TIER_ORDER: TierId[] = ["free", "plus", "pro"];

export interface TierDefinition {
  id: TierId;
  label: string;
  priceMonthly: number;
  tagline: string;
  access: string[];
  locked: string[];
}

export const TIERS: Record<TierId, TierDefinition> = {
  free: {
    id: "free",
    label: "Free",
    priceMonthly: 0,
    tagline: "Prove the first outcome.",
    access: [
      "1 daily typed Compass Reading",
      "Full 6A Engine result with action, habit loop, gratitude anchor, and service action",
      "Browser-native voice input where supported",
      "Browser-native read-aloud where supported",
      "Basic alignment score and mode",
      "Local-only history",
    ],
    locked: [
      "Unlimited sessions",
      "Cloud history",
      "Premium A&A Aligned Voice Coach",
      "Weekly reports",
      "Certification pathway",
    ],
  },
  plus: {
    id: "plus",
    label: "Plus",
    priceMonthly: 19,
    tagline: "Consistency and saved progress.",
    access: [
      "Unlimited typed Compass sessions",
      "Cloud session history",
      "Streaks, habit loops, and reminders",
      "Saved listen mode / read-aloud",
      "7-day and 30-day plans",
      "Export readings (TXT / print-to-PDF)",
      "Basic weekly pattern summaries",
    ],
    locked: [
      "Premium realtime voice coach",
      "Certification pathway",
      "Advanced supervised coaching tools",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    priceMonthly: 99,
    tagline: "Transformation and coaching depth.",
    access: [
      "Everything in Plus",
      "Premium A&A Aligned Voice Coach (realtime conversation)",
      "Pattern memory across sessions",
      "Advanced weekly coach reports",
      "Advanced modes: Money, Business, Purpose, Discipline, Peace, Fear Release, Gratitude, Night Review",
      "30-day transformation plans",
      "Certification pathway eligibility (application required — not automatic)",
    ],
    locked: [
      "Automatic certification",
      "Admin verification tools",
    ],
  },
};

export type Feature =
  | "session_daily" // any tier can run at least one session per day
  | "unlimited_sessions"
  | "cloud_history"
  | "streaks"
  | "habit_tracking"
  | "reminders"
  | "saved_listen_mode"
  | "exports"
  | "plan_7day"
  | "plan_30day"
  | "weekly_report_basic"
  | "weekly_report_advanced"
  | "pattern_memory"
  | "pro_voice"
  | "advanced_modes"
  | "certification_pathway";

const FREE_FEATURES: Feature[] = ["session_daily", "plan_7day"];

const PLUS_FEATURES: Feature[] = [
  ...FREE_FEATURES,
  "unlimited_sessions",
  "cloud_history",
  "streaks",
  "habit_tracking",
  "reminders",
  "saved_listen_mode",
  "exports",
  "plan_30day",
  "weekly_report_basic",
];

const PRO_FEATURES: Feature[] = [
  ...PLUS_FEATURES,
  "weekly_report_advanced",
  "pattern_memory",
  "pro_voice",
  "advanced_modes",
  "certification_pathway",
];

export const ENTITLEMENTS: Record<TierId, ReadonlySet<Feature>> = {
  free: new Set(FREE_FEATURES),
  plus: new Set(PLUS_FEATURES),
  pro: new Set(PRO_FEATURES),
};

export function hasFeature(tier: TierId, feature: Feature): boolean {
  return ENTITLEMENTS[tier].has(feature);
}

/** Free users get exactly one typed Compass Reading per day. Paid tiers are unlimited. */
export function dailySessionLimit(tier: TierId): number {
  return hasFeature(tier, "unlimited_sessions") ? Number.POSITIVE_INFINITY : 1;
}

export function tierAtLeast(tier: TierId, minimum: TierId): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minimum);
}

/** Map the Prisma enum (FREE/PLUS/PRO) to the lowercase tier id used across app logic. */
export function tierFromDb(dbTier: "FREE" | "PLUS" | "PRO"): TierId {
  return dbTier.toLowerCase() as TierId;
}

export function tierToDb(tier: TierId): "FREE" | "PLUS" | "PRO" {
  return tier.toUpperCase() as "FREE" | "PLUS" | "PRO";
}

/** Honest labeling required by docs/AA_Compass_v5_Voice_Architecture.md. */
export const BROWSER_VOICE_LABEL =
  "Free voice uses your browser/device voice features. Quality and availability may vary. Premium A&A Aligned Voice Coach is available in Pro.";
