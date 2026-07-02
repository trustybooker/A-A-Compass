import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";
import { enforceOutputClaims } from "@/lib/safety";
import { audit } from "@/lib/audit";

const completeSchema = z.object({
  summary: z.string().max(20000).default(""),
});

/** Save the session summary when a Pro voice conversation ends. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireFeature("pro_voice");
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid summary." }, { status: 400 });
    }

    const session = await prisma.voiceSession.findFirst({ where: { id, userId: user.id } });
    if (!session) {
      return Response.json({ error: "Voice session not found." }, { status: 404 });
    }

    // Safety gate: even voice summaries must never carry prohibited claims.
    const { text: safeSummary } = enforceOutputClaims(parsed.data.summary);

    await prisma.voiceSession.update({
      where: { id: session.id },
      data: { endedAt: new Date(), summary: safeSummary || null },
    });
    await audit({
      userId: user.id,
      action: "voice.pro_session_completed",
      targetType: "voice_session",
      targetId: session.id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
