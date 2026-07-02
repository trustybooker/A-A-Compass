import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse, HttpError } from "@/lib/current-user";
import { audit } from "@/lib/audit";
import {
  TRAINING_MODULE_COUNT,
  scoreWrittenAssessment,
} from "@/lib/certification/pathway";

const stepSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("ethics_agree") }),
  z.object({
    step: z.literal("identity_submit"),
    fullLegalName: z.string().min(2).max(200),
    country: z.string().min(2).max(100),
  }),
  z.object({
    step: z.literal("training_module_complete"),
    moduleIndex: z.number().int().min(0).max(TRAINING_MODULE_COUNT - 1),
  }),
  z.object({
    step: z.literal("written_submit"),
    answers: z.record(z.string(), z.number().int().min(0).max(3)),
  }),
  z.object({
    step: z.literal("practical_submit"),
    transcript: z.string().min(200, "Please include the full simulation transcript.").max(50000),
  }),
]);

/**
 * Applicant-driven pathway steps. Order is enforced server-side, and the
 * steps that require human review (identity verification, practical scoring,
 * supervised review, final approval) can NOT be completed here — only staff
 * can advance those via the admin API.
 */
export async function POST(req: Request) {
  try {
    const user = await requireFeature("certification_pathway");
    const body = await req.json().catch(() => null);
    const parsed = stepSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid step." },
        { status: 400 },
      );
    }

    const app = await prisma.certificationApplication.findFirst({
      where: { userId: user.id, status: { in: ["SUBMITTED", "IN_PROGRESS", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" },
    });
    if (!app) throw new HttpError(404, "No open application. Apply first.");

    const data = parsed.data;
    switch (data.step) {
      case "ethics_agree": {
        if (app.ethicsAgreedAt) break;
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: { ethicsAgreedAt: new Date(), status: "IN_PROGRESS" },
        });
        await audit({
          userId: user.id,
          action: "certification.ethics_agreed",
          targetType: "certification_application",
          targetId: app.id,
        });
        break;
      }
      case "identity_submit": {
        if (!app.ethicsAgreedAt) throw new HttpError(400, "Agree to the ethics commitment first.");
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: { identitySubmittedAt: new Date() },
        });
        // Identity details go to the audit trail for staff review — verification
        // itself is a human decision made through the admin API.
        await audit({
          userId: user.id,
          action: "certification.identity_submitted",
          targetType: "certification_application",
          targetId: app.id,
          metadata: { fullLegalName: data.fullLegalName, country: data.country },
        });
        break;
      }
      case "training_module_complete": {
        if (!app.ethicsAgreedAt) throw new HttpError(400, "Agree to the ethics commitment first.");
        const completed = Math.max(app.trainingModulesCompleted, data.moduleIndex + 1);
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: {
            trainingModulesCompleted: completed,
            trainingCompletedAt:
              completed >= TRAINING_MODULE_COUNT ? (app.trainingCompletedAt ?? new Date()) : null,
          },
        });
        break;
      }
      case "written_submit": {
        if (!app.trainingCompletedAt) {
          throw new HttpError(400, "Complete all training modules before the written assessment.");
        }
        const { scorePercent, passed } = scoreWrittenAssessment(data.answers);
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: {
            writtenScore: scorePercent,
            writtenPassedAt: passed ? new Date() : null,
          },
        });
        await audit({
          userId: user.id,
          action: "certification.written_submitted",
          targetType: "certification_application",
          targetId: app.id,
          metadata: { scorePercent, passed },
        });
        return Response.json({ ok: true, scorePercent, passed });
      }
      case "practical_submit": {
        if (!app.writtenPassedAt) {
          throw new HttpError(400, "Pass the written assessment before the practical simulation.");
        }
        await prisma.certificationApplication.update({
          where: { id: app.id },
          data: { practicalTranscript: data.transcript, status: "UNDER_REVIEW" },
        });
        await audit({
          userId: user.id,
          action: "certification.practical_submitted",
          targetType: "certification_application",
          targetId: app.id,
        });
        break;
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
