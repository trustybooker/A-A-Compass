// A&A Compass v5 — certification pathway state machine.
// Source of truth: docs/AA_Compass_v5_Certification_Blueprint.md.
//
// Certification is Pro-only but NOT automatic. Every requirement below must be
// satisfied, and final approval is a human admin decision. Client UI never
// grants anything — these checks run server-side.

import type { TierId } from "@/lib/tiers";
import { hasFeature } from "@/lib/tiers";

export const CERTIFICATION_NAME = "A&A Compass Certified Alignment Coach";

export const CERTIFICATION_SCOPE =
  "Proprietary coaching-method certification for the A&A Compass system. It is not a therapy license, financial advisor license, medical credential, legal credential, or ICF credential.";

export const TRAINING_MODULE_COUNT = 6;

export const TRAINING_MODULES = [
  "The 6A Engine: Awareness, Alignment, Aim, Action, Accumulation, Abundance",
  "Truthful reflection without judgment or blame",
  "Connecting belief to behavior: actions, habit loops, and evidence",
  "Ethics: autonomy, confidentiality, and never guaranteeing outcomes",
  "Scope and referral: recognizing therapy, medical, legal, and financial boundaries",
  "Service and increase: building outcomes that create value for others",
] as const;

export const WRITTEN_PASS_SCORE = 80; // percent
export const PRACTICAL_PASS_SCORE = 80; // percent
export const CREDENTIAL_VALIDITY_DAYS = 365; // annual renewal

export interface ApplicationState {
  status: "SUBMITTED" | "IN_PROGRESS" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  ethicsAgreedAt: Date | null;
  identitySubmittedAt: Date | null;
  identityVerifiedAt: Date | null;
  trainingModulesCompleted: number;
  trainingCompletedAt: Date | null;
  writtenScore: number | null;
  writtenPassedAt: Date | null;
  practicalScore: number | null;
  practicalPassedAt: Date | null;
  supervisedReviewPassedAt: Date | null;
}

export type PathwayStepId =
  | "application"
  | "ethics_agreement"
  | "identity_verification"
  | "training"
  | "written_assessment"
  | "practical_simulation"
  | "supervised_review"
  | "admin_approval";

export interface PathwayStep {
  id: PathwayStepId;
  label: string;
  description: string;
  done: boolean;
  /** True when this step is waiting on staff review rather than the applicant. */
  awaitingReview: boolean;
}

/** Only active Pro subscribers may enter the pathway. */
export function canApply(tier: TierId): boolean {
  return hasFeature(tier, "certification_pathway");
}

export function pathwaySteps(app: ApplicationState): PathwayStep[] {
  return [
    {
      id: "application",
      label: "Application & purpose statement",
      description: "Tell us why you want to coach with the A&A Compass method.",
      done: true, // an ApplicationState only exists once submitted
      awaitingReview: false,
    },
    {
      id: "ethics_agreement",
      label: "Ethics agreement",
      description:
        "Commit to autonomy, confidentiality, honest claims, and referral boundaries.",
      done: app.ethicsAgreedAt !== null,
      awaitingReview: false,
    },
    {
      id: "identity_verification",
      label: "Identity verification",
      description: "Submit identity details; staff verify before you continue.",
      done: app.identityVerifiedAt !== null,
      awaitingReview: app.identitySubmittedAt !== null && app.identityVerifiedAt === null,
    },
    {
      id: "training",
      label: `Training modules (${app.trainingModulesCompleted}/${TRAINING_MODULE_COUNT})`,
      description: "Complete all training modules on the 6A method, ethics, and scope.",
      done: app.trainingCompletedAt !== null,
      awaitingReview: false,
    },
    {
      id: "written_assessment",
      label: "Written assessment",
      description: `Score at least ${WRITTEN_PASS_SCORE}% on the written assessment.`,
      done: app.writtenPassedAt !== null,
      awaitingReview: false,
    },
    {
      id: "practical_simulation",
      label: "Practical coaching simulation",
      description: "Complete a coaching simulation; staff score it against the rubric.",
      done: app.practicalPassedAt !== null,
      awaitingReview: app.practicalScore === null && app.writtenPassedAt !== null && false,
    },
    {
      id: "supervised_review",
      label: "Supervised practice review",
      description: "A reviewer observes your practice sessions and signs off.",
      done: app.supervisedReviewPassedAt !== null,
      awaitingReview: app.practicalPassedAt !== null && app.supervisedReviewPassedAt === null,
    },
    {
      id: "admin_approval",
      label: "Final approval & credential issuance",
      description: "An administrator reviews the full record and issues the credential.",
      done: app.status === "APPROVED",
      awaitingReview: app.supervisedReviewPassedAt !== null && app.status !== "APPROVED",
    },
  ];
}

/** All requirements that must hold before an admin may approve. */
export function readyForApproval(app: ApplicationState): { ready: boolean; missing: string[] } {
  const missing: string[] = [];
  if (app.ethicsAgreedAt === null) missing.push("ethics agreement");
  if (app.identityVerifiedAt === null) missing.push("identity verification");
  if (app.trainingCompletedAt === null || app.trainingModulesCompleted < TRAINING_MODULE_COUNT)
    missing.push("training completion");
  if (app.writtenPassedAt === null || (app.writtenScore ?? 0) < WRITTEN_PASS_SCORE)
    missing.push("written assessment pass");
  if (app.practicalPassedAt === null || (app.practicalScore ?? 0) < PRACTICAL_PASS_SCORE)
    missing.push("practical simulation pass");
  if (app.supervisedReviewPassedAt === null) missing.push("supervised practice review");
  if (["APPROVED", "REJECTED", "WITHDRAWN"].includes(app.status)) missing.push("open application");
  return { ready: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Written assessment (auto-scored server-side).
// ---------------------------------------------------------------------------

export interface WrittenQuestion {
  id: string;
  prompt: string;
  options: string[];
  /** index into options — never sent to the client */
  answer: number;
}

export const WRITTEN_ASSESSMENT: WrittenQuestion[] = [
  {
    id: "q1",
    prompt: "A client asks you to guarantee their income will double in 90 days. What do you do?",
    options: [
      "Guarantee it if they commit fully to the program",
      "Decline to guarantee outcomes, reset honest expectations, and refocus on aligned action and habits",
      "Guarantee it but add a written disclaimer",
      "Tell them results are guaranteed for Pro subscribers",
    ],
    answer: 1,
  },
  {
    id: "q2",
    prompt: "In the 6A Engine, what does 'Accumulation' refer to?",
    options: [
      "Accumulating wealth as proof of alignment",
      "Collecting testimonials from clients",
      "Creating a habit loop so aligned action compounds over time",
      "Saving all session transcripts",
    ],
    answer: 2,
  },
  {
    id: "q3",
    prompt: "A client shares thoughts of self-harm during a session. What is the correct response?",
    options: [
      "Continue the coaching plan to keep them focused",
      "Pause coaching, respond with supportive safety guidance, and refer to crisis resources / professionals",
      "Schedule an extra coaching session tomorrow",
      "Tell them alignment work will resolve it",
    ],
    answer: 1,
  },
  {
    id: "q4",
    prompt: "Which outcome must EVERY A&A Compass session include?",
    options: [
      "A revenue projection",
      "A referral to another paid program",
      "Truth reflection, deeper value, misalignment, vision, one action, one habit loop, one gratitude anchor, one service action",
      "A personality type assignment",
    ],
    answer: 2,
  },
  {
    id: "q5",
    prompt: "A client credits you with everything and says they can't decide anything without you. You should:",
    options: [
      "Offer them a discounted long-term retainer",
      "Accept it as evidence of strong coaching",
      "Name the dependency pattern, reinforce their autonomy, and build their self-trust into the plan",
      "Increase session frequency",
    ],
    answer: 2,
  },
  {
    id: "q6",
    prompt: "A client asks whether to stop their prescribed medication to 'trust the process'. You should:",
    options: [
      "Support their intuition",
      "Say that is a medical decision for their doctor, never coaching territory, and encourage them to speak with their physician",
      "Suggest a gradual reduction",
      "Share what worked for another client",
    ],
    answer: 1,
  },
  {
    id: "q7",
    prompt: "What does the 'Abundance/Increase' step require?",
    options: [
      "Connecting the desire to service and value for others",
      "Setting a higher income target",
      "Visualizing abundance twice daily",
      "Upgrading the client to a higher tier",
    ],
    answer: 0,
  },
  {
    id: "q8",
    prompt: "Which of these violates the coach ethics agreement?",
    options: [
      "Referring a grieving client to a licensed therapist",
      "Telling a client their hardship is their own fault for being misaligned",
      "Ending a session with a gratitude anchor",
      "Declining to advise on a lawsuit",
    ],
    answer: 1,
  },
  {
    id: "q9",
    prompt: "How may the credential be represented publicly?",
    options: [
      "As a counseling license for life coaching",
      "As proof the holder can guarantee client results",
      "As a proprietary A&A Compass coaching-method certification, verifiable by credential ID and QR code",
      "As equivalent to an ICF credential",
    ],
    answer: 2,
  },
  {
    id: "q10",
    prompt: "When does certification expire, and what does renewal require?",
    options: [
      "It never expires",
      "It renews automatically while Pro is active",
      "Annually — with ethics recommitment, a short renewal assessment, and evidence of continued practice",
      "Every five years with a fee",
    ],
    answer: 2,
  },
];

/** Score submitted answers (map of questionId -> chosen option index). */
export function scoreWrittenAssessment(answers: Record<string, number>): {
  scorePercent: number;
  passed: boolean;
} {
  const correct = WRITTEN_ASSESSMENT.filter((q) => answers[q.id] === q.answer).length;
  const scorePercent = Math.round((correct / WRITTEN_ASSESSMENT.length) * 100);
  return { scorePercent, passed: scorePercent >= WRITTEN_PASS_SCORE };
}

/** Questions with answers stripped, safe to send to the client. */
export function writtenAssessmentForClient(): Array<Omit<WrittenQuestion, "answer">> {
  return WRITTEN_ASSESSMENT.map(({ answer: _answer, ...q }) => q);
}

export const ETHICS_AGREEMENT_TEXT = [
  `As an applicant to become an ${CERTIFICATION_NAME}, I commit to the following:`,
  "",
  "1. I will never promise guaranteed income, healing, manifestation, or outcomes.",
  "2. I will never present this certification as a therapy license, medical, legal, financial, or ICF credential.",
  "3. I will protect client autonomy and never build dependency on me or on the A&A Compass system.",
  "4. I will keep client information confidential.",
  "5. I will refer clients to licensed professionals when their needs are outside coaching scope, including crisis, medical, legal, and financial matters.",
  "6. I will never blame clients for their hardship.",
  "7. I will not use coercive spiritual or religious framing.",
  "8. I will use the credential only while it is active, renew it annually, and surrender it if revoked.",
  "9. I understand the credential is non-transferable and verifiable by its credential ID and QR code.",
].join("\n");

export const REVOCATION_TRIGGERS = [
  "False income claims",
  "Misrepresenting the credential as therapy or a license",
  "Selling guaranteed outcomes",
  "Breaching confidentiality",
  "Harassment, manipulation, or coercive spiritual claims",
  "Using the certificate after expiration",
] as const;
