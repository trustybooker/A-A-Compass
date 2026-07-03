import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, errorResponse, HttpError } from "@/lib/current-user";
import { audit } from "@/lib/audit";
import {
  readyForApproval,
  CERTIFICATION_SCOPE,
  CREDENTIAL_VALIDITY_DAYS,
  PRACTICAL_PASS_SCORE,
} from "@/lib/certification/pathway";
import { generateCredentialId } from "@/lib/certification/credential";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify_identity") }),
  z.object({ action: z.literal("score_practical"), score: z.number().int().min(0).max(100) }),
  z.object({ action: z.literal("pass_supervised_review"), notes: z.string().max(8000).default("") }),
  z.object({ action: z.literal("approve"), notes: z.string().max(8000).default("") }),
  z.object({ action: z.literal("reject"), notes: z.string().min(1).max(8000) }),
  z.object({ action: z.literal("revoke"), reason: z.string().min(1).max(2000) }),
  z.object({ action: z.literal("suspend"), reason: z.string().min(1).max(2000) }),
  z.object({ action: z.literal("reinstate") }),
  z.object({ action: z.literal("renew") }),
]);

/**
 * Staff review actions on a certification application / credential.
 * Every action is audit-logged; approval re-verifies every pathway
 * requirement server-side before a credential can exist.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid action." }, { status: 400 });
    }
    const data = parsed.data;

    const app = await prisma.certificationApplication.findUnique({
      where: { id },
      include: { user: true, certification: true },
    });
    if (!app) throw new HttpError(404, "Application not found.");

    const auditAction = async (action: string, metadata?: Record<string, unknown>) =>
      audit({
        userId: app.userId,
        actorId: admin.id,
        action,
        targetType: "certification_application",
        targetId: app.id,
        metadata,
      });

    switch (data.action) {
      case "verify_identity": {
        if (!app.identitySubmittedAt) throw new HttpError(400, "Applicant has not submitted identity yet.");
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: { identityVerifiedAt: new Date() },
        });
        await auditAction("certification.identity_verified");
        break;
      }
      case "score_practical": {
        if (!app.practicalTranscript) throw new HttpError(400, "No practical simulation submitted.");
        const passed = data.score >= PRACTICAL_PASS_SCORE;
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: { practicalScore: data.score, practicalPassedAt: passed ? new Date() : null },
        });
        await auditAction("certification.practical_scored", { score: data.score, passed });
        break;
      }
      case "pass_supervised_review": {
        if (!app.practicalPassedAt) throw new HttpError(400, "Practical simulation must pass first.");
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: { supervisedReviewPassedAt: new Date(), supervisedReviewNotes: data.notes || null },
        });
        await auditAction("certification.supervised_review_passed");
        break;
      }
      case "approve": {
        const readiness = readyForApproval({
          status: app.status,
          ethicsAgreedAt: app.ethicsAgreedAt,
          identitySubmittedAt: app.identitySubmittedAt,
          identityVerifiedAt: app.identityVerifiedAt,
          trainingModulesCompleted: app.trainingModulesCompleted,
          trainingCompletedAt: app.trainingCompletedAt,
          writtenScore: app.writtenScore,
          writtenPassedAt: app.writtenPassedAt,
          practicalSubmitted: app.practicalTranscript !== null,
          practicalScore: app.practicalScore,
          practicalPassedAt: app.practicalPassedAt,
          supervisedReviewPassedAt: app.supervisedReviewPassedAt,
        });
        if (!readiness.ready) {
          throw new HttpError(400, `Cannot approve — missing: ${readiness.missing.join(", ")}.`);
        }
        const credentialId = generateCredentialId();
        const expiresAt = new Date(Date.now() + CREDENTIAL_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
        const certification = await prisma.certification.create({
          data: {
            userId: app.userId,
            applicationId: app.id,
            credentialId,
            status: "ACTIVE",
            holderName: app.user.name ?? app.user.email,
            scope: CERTIFICATION_SCOPE,
            expiresAt,
            events: { create: { type: "ISSUED", actorId: admin.id } },
          },
        });
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: {
            status: "APPROVED",
            reviewerId: admin.id,
            decisionNotes: data.notes || null,
            decidedAt: new Date(),
          },
        });
        await auditAction("certification.approved", { credentialId: certification.credentialId });
        return Response.json({ ok: true, credentialId: certification.credentialId });
      }
      case "reject": {
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: {
            status: "REJECTED",
            reviewerId: admin.id,
            decisionNotes: data.notes,
            decidedAt: new Date(),
          },
        });
        await auditAction("certification.rejected");
        break;
      }
      case "revoke":
      case "suspend":
      case "reinstate":
      case "renew": {
        const cert = app.certification;
        if (!cert) throw new HttpError(400, "No credential exists for this application.");
        if (data.action === "revoke") {
          await prisma.certification.update({
            where: { id: cert.id },
            data: {
              status: "REVOKED",
              revokedAt: new Date(),
              revocationReason: data.reason,
              events: { create: { type: "REVOKED", notes: data.reason, actorId: admin.id } },
            },
          });
          await auditAction("certification.revoked", { reason: data.reason });
        } else if (data.action === "suspend") {
          if (cert.status === "REVOKED") throw new HttpError(400, "Credential is revoked.");
          await prisma.certification.update({
            where: { id: cert.id },
            data: {
              status: "SUSPENDED",
              events: { create: { type: "SUSPENDED", notes: data.reason, actorId: admin.id } },
            },
          });
          await auditAction("certification.suspended", { reason: data.reason });
        } else if (data.action === "reinstate") {
          if (cert.status !== "SUSPENDED") throw new HttpError(400, "Only suspended credentials can be reinstated.");
          await prisma.certification.update({
            where: { id: cert.id },
            data: {
              status: "ACTIVE",
              events: { create: { type: "REINSTATED", actorId: admin.id } },
            },
          });
          await auditAction("certification.reinstated");
        } else {
          // Annual renewal: extend expiry, record recommitment.
          if (cert.status === "REVOKED") throw new HttpError(400, "Revoked credentials cannot be renewed.");
          const expiresAt = new Date(Date.now() + CREDENTIAL_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
          await prisma.certification.update({
            where: { id: cert.id },
            data: {
              status: "ACTIVE",
              expiresAt,
              renewedAt: new Date(),
              events: { create: { type: "RENEWED", actorId: admin.id } },
            },
          });
          await auditAction("certification.renewed", { expiresAt: expiresAt.toISOString() });
        }
        break;
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
