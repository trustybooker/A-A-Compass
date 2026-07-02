import { describe, it, expect } from "vitest";
import {
  canApply,
  readyForApproval,
  scoreWrittenAssessment,
  pathwaySteps,
  WRITTEN_ASSESSMENT,
  WRITTEN_PASS_SCORE,
  TRAINING_MODULE_COUNT,
  type ApplicationState,
} from "@/lib/certification/pathway";
import {
  generateCredentialId,
  isValidCredentialIdFormat,
  liveCredentialStatus,
  verificationUrl,
} from "@/lib/certification/credential";

const emptyApp = (): ApplicationState => ({
  status: "SUBMITTED",
  ethicsAgreedAt: null,
  identitySubmittedAt: null,
  identityVerifiedAt: null,
  trainingModulesCompleted: 0,
  trainingCompletedAt: null,
  writtenScore: null,
  writtenPassedAt: null,
  practicalScore: null,
  practicalPassedAt: null,
  supervisedReviewPassedAt: null,
});

const completeApp = (): ApplicationState => ({
  status: "UNDER_REVIEW",
  ethicsAgreedAt: new Date(),
  identitySubmittedAt: new Date(),
  identityVerifiedAt: new Date(),
  trainingModulesCompleted: TRAINING_MODULE_COUNT,
  trainingCompletedAt: new Date(),
  writtenScore: 90,
  writtenPassedAt: new Date(),
  practicalScore: 85,
  practicalPassedAt: new Date(),
  supervisedReviewPassedAt: new Date(),
});

describe("certification eligibility", () => {
  it("only pro may enter the pathway — free and plus are locked out", () => {
    expect(canApply("free")).toBe(false);
    expect(canApply("plus")).toBe(false);
    expect(canApply("pro")).toBe(true);
  });
});

describe("approval gating — certification is never automatic", () => {
  it("a fresh application is nowhere near approvable", () => {
    const { ready, missing } = readyForApproval(emptyApp());
    expect(ready).toBe(false);
    expect(missing).toEqual(
      expect.arrayContaining([
        "ethics agreement",
        "identity verification",
        "training completion",
        "written assessment pass",
        "practical simulation pass",
        "supervised practice review",
      ]),
    );
  });

  it("every single missing requirement blocks approval", () => {
    const requirements: Array<[keyof ApplicationState, unknown]> = [
      ["ethicsAgreedAt", null],
      ["identityVerifiedAt", null],
      ["trainingCompletedAt", null],
      ["writtenPassedAt", null],
      ["practicalPassedAt", null],
      ["supervisedReviewPassedAt", null],
    ];
    for (const [key, value] of requirements) {
      const app = { ...completeApp(), [key]: value };
      expect(readyForApproval(app).ready, `missing ${key} must block`).toBe(false);
    }
  });

  it("a below-threshold written or practical score blocks approval even if timestamps exist", () => {
    expect(readyForApproval({ ...completeApp(), writtenScore: 70 }).ready).toBe(false);
    expect(readyForApproval({ ...completeApp(), practicalScore: 60 }).ready).toBe(false);
  });

  it("a fully complete application is approvable", () => {
    expect(readyForApproval(completeApp()).ready).toBe(true);
  });

  it("closed applications cannot be re-approved", () => {
    expect(readyForApproval({ ...completeApp(), status: "APPROVED" }).ready).toBe(false);
    expect(readyForApproval({ ...completeApp(), status: "REJECTED" }).ready).toBe(false);
  });
});

describe("written assessment scoring", () => {
  it("scores 100% for all correct answers and passes", () => {
    const answers = Object.fromEntries(WRITTEN_ASSESSMENT.map((q) => [q.id, q.answer]));
    const result = scoreWrittenAssessment(answers);
    expect(result.scorePercent).toBe(100);
    expect(result.passed).toBe(true);
  });

  it("fails below the pass threshold", () => {
    const answers = Object.fromEntries(
      WRITTEN_ASSESSMENT.map((q, i) => [q.id, i < 5 ? q.answer : (q.answer + 1) % 4]),
    );
    const result = scoreWrittenAssessment(answers);
    expect(result.scorePercent).toBe(50);
    expect(result.passed).toBe(false);
    expect(result.scorePercent).toBeLessThan(WRITTEN_PASS_SCORE);
  });

  it("treats missing answers as wrong", () => {
    expect(scoreWrittenAssessment({}).scorePercent).toBe(0);
  });
});

describe("pathway steps", () => {
  it("renders all eight requirements", () => {
    const steps = pathwaySteps(emptyApp());
    expect(steps.map((s) => s.id)).toEqual([
      "application",
      "ethics_agreement",
      "identity_verification",
      "training",
      "written_assessment",
      "practical_simulation",
      "supervised_review",
      "admin_approval",
    ]);
    expect(steps.filter((s) => s.done)).toHaveLength(1); // only the application itself
  });
});

describe("credential identity", () => {
  it("generates unique, well-formed credential ids", () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateCredentialId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(isValidCredentialIdFormat(id)).toBe(true);
  });

  it("rejects malformed credential ids before touching the database", () => {
    expect(isValidCredentialIdFormat("AAC-00000-00000")).toBe(false); // ambiguous chars excluded
    expect(isValidCredentialIdFormat("XYZ-ABCDE-FGHJK")).toBe(false);
    expect(isValidCredentialIdFormat("AAC-ABC-DEF")).toBe(false);
  });

  it("builds the public verification URL", () => {
    expect(verificationUrl("AAC-AAAAA-AAAAA", "https://compass.example.com")).toBe(
      "https://compass.example.com/certification/verify/AAC-AAAAA-AAAAA",
    );
  });
});

describe("live credential status — revoked/expired can never display active", () => {
  const future = new Date(Date.now() + 86400_000);
  const past = new Date(Date.now() - 86400_000);

  it("shows active only for an unexpired ACTIVE credential", () => {
    expect(liveCredentialStatus("ACTIVE", future)).toBe("active");
  });

  it("revoked stays revoked regardless of expiry", () => {
    expect(liveCredentialStatus("REVOKED", future)).toBe("revoked");
    expect(liveCredentialStatus("REVOKED", past)).toBe("revoked");
  });

  it("suspended shows suspended", () => {
    expect(liveCredentialStatus("SUSPENDED", future)).toBe("suspended");
  });

  it("an ACTIVE row past its expiry shows expired, not active", () => {
    expect(liveCredentialStatus("ACTIVE", past)).toBe("expired");
  });
});
