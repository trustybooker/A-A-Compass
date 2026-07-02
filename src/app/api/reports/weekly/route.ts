import { prisma } from "@/lib/prisma";
import { requireFeature, errorResponse } from "@/lib/current-user";
import { buildWeeklyReport, weekStartOf } from "@/lib/reports";
import { tierToDb } from "@/lib/tiers";
import type { Prisma } from "@prisma/client";

/**
 * Build (and persist) the current week's report.
 * Plus receives the basic pattern summary; Pro receives the advanced coach
 * report — the level is decided server-side from the live tier.
 */
export async function GET() {
  try {
    const user = await requireFeature("weekly_report_basic");
    const weekStart = weekStartOf(new Date());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sessions = await prisma.compassSession.findMany({
      where: { userId: user.id, createdAt: { gte: weekStart, lt: weekEnd } },
      select: {
        area: true,
        currentState: true,
        fearText: true,
        createdAt: true,
        result: { select: { score: true } },
      },
    });
    const habits = await prisma.habit.findMany({
      where: { userId: user.id, archived: false },
      include: { logs: { where: { logDate: { gte: weekStart, lt: weekEnd } } } },
    });

    const report = buildWeeklyReport({
      tier: user.tier,
      weekStart,
      sessions: sessions
        .filter((s) => s.result)
        .map((s) => ({
          area: s.area,
          currentState: s.currentState,
          score: s.result!.score,
          fearText: s.fearText,
          createdAt: s.createdAt,
        })),
      habits: habits.map((h) => ({
        habitName: h.name,
        logDates: h.logs.map((l) => l.logDate),
      })),
    });

    await prisma.weeklyReport.upsert({
      where: { userId_weekStart: { userId: user.id, weekStart } },
      update: {
        tierAtRun: tierToDb(user.tier),
        sessionsCount: report.sessionsCount,
        averageScore: report.averageScore,
        topAreas: report.topAreas,
        patterns: report.patterns as unknown as Prisma.InputJsonValue,
        insights: report.insights,
      },
      create: {
        userId: user.id,
        weekStart,
        tierAtRun: tierToDb(user.tier),
        sessionsCount: report.sessionsCount,
        averageScore: report.averageScore,
        topAreas: report.topAreas,
        patterns: report.patterns as unknown as Prisma.InputJsonValue,
        insights: report.insights,
      },
    });

    return Response.json({ report });
  } catch (error) {
    return errorResponse(error);
  }
}
