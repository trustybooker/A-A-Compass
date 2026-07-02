import { prisma } from "@/lib/prisma";
import { requireUser, errorResponse } from "@/lib/current-user";
import { audit } from "@/lib/audit";

/**
 * Full personal data export (JSON). Available to every tier — data rights are
 * not a paid feature.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const [record, sessions, actions, habits, habitLogs, voiceSessions, weeklyReports, certApplications, certifications] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, email: true, name: true, tier: true, createdAt: true },
        }),
        prisma.compassSession.findMany({ where: { userId: user.id }, include: { result: true } }),
        prisma.actionItem.findMany({ where: { userId: user.id } }),
        prisma.habit.findMany({ where: { userId: user.id } }),
        prisma.habitLog.findMany({ where: { userId: user.id } }),
        prisma.voiceSession.findMany({ where: { userId: user.id } }),
        prisma.weeklyReport.findMany({ where: { userId: user.id } }),
        prisma.certificationApplication.findMany({ where: { userId: user.id } }),
        prisma.certification.findMany({ where: { userId: user.id }, include: { events: true } }),
      ]);

    await audit({ userId: user.id, action: "account.data_exported" });

    const payload = {
      exportedAt: new Date().toISOString(),
      user: record,
      sessions,
      actions,
      habits,
      habitLogs,
      voiceSessions,
      weeklyReports,
      certificationApplications: certApplications,
      certifications,
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="aa-compass-data-export.json"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
