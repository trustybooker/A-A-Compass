import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";
import { audit } from "@/lib/audit";

const applySchema = z.object({
  purposeStatement: z.string().min(50, "Please write at least a few sentences.").max(8000),
});

/**
 * Enter the certification pathway. Pro-only eligibility — and submitting an
 * application grants NOTHING automatically (docs/AA_Compass_v5_Certification_Blueprint.md).
 */
export async function POST(req: Request) {
  try {
    const user = await requireFeature("certification_pathway");
    const body = await req.json().catch(() => null);
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid application." },
        { status: 400 },
      );
    }

    const open = await prisma.certificationApplication.findFirst({
      where: { userId: user.id, status: { in: ["SUBMITTED", "IN_PROGRESS", "UNDER_REVIEW"] } },
    });
    if (open) {
      return Response.json({ error: "You already have an application in progress." }, { status: 409 });
    }

    const application = await prisma.certificationApplication.create({
      data: {
        userId: user.id,
        status: "SUBMITTED",
        purposeStatement: parsed.data.purposeStatement,
      },
      select: { id: true },
    });
    await audit({
      userId: user.id,
      action: "certification.application_submitted",
      targetType: "certification_application",
      targetId: application.id,
    });

    return Response.json({ applicationId: application.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
