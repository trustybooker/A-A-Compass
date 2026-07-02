import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, errorResponse } from "@/lib/current-user";
import { audit } from "@/lib/audit";

const deleteSchema = z.object({
  confirm: z.literal("DELETE"),
});

/**
 * Permanent account deletion. Cascades all personal data; the audit trail
 * keeps an anonymized deletion record (userId is nulled by design — audit
 * rows have no FK cascade).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Type "DELETE" to confirm.' }, { status: 400 });
    }

    await audit({
      userId: null, // anonymized by design — the account is about to disappear
      actorId: user.id,
      action: "account.deleted",
      metadata: { hadTier: user.tier },
    });
    await prisma.auditLog.updateMany({ where: { userId: user.id }, data: { userId: null } });
    await prisma.user.delete({ where: { id: user.id } });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
