import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";
import { audit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireFeature("exports"); // Plus and Pro only
    const { id } = await params;
    const session = await prisma.compassSession.findFirst({
      where: { id, userId: user.id },
      include: { result: true },
    });
    if (!session?.result) {
      return Response.json({ error: "Session not found." }, { status: 404 });
    }
    await audit({
      userId: user.id,
      action: "session.exported",
      targetType: "compass_session",
      targetId: session.id,
    });
    const filename = `aa-compass-reading-${session.createdAt.toISOString().slice(0, 10)}.txt`;
    return new Response(session.result.fullText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
