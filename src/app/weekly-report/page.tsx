import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/tiers";
import { buildWeeklyReport, weekStartOf } from "@/lib/reports";
import { UpgradeGate } from "@/components/UpgradeGate";

export const metadata = { title: "Weekly report" };
export const dynamic = "force-dynamic";

export default async function WeeklyReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!hasFeature(user.tier, "weekly_report_basic")) {
    return (
      <UpgradeGate
        requiredTier="plus"
        featureName="Weekly reports"
        detail="Plus includes a weekly pattern summary. Pro adds the advanced coach report with pattern memory and habit evidence."
      />
    );
  }

  const weekStart = weekStartOf(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [sessions, habits] = await Promise.all([
    prisma.compassSession.findMany({
      where: { userId: user.id, createdAt: { gte: weekStart, lt: weekEnd } },
      select: {
        area: true,
        currentState: true,
        fearText: true,
        createdAt: true,
        result: { select: { score: true } },
      },
    }),
    prisma.habit.findMany({
      where: { userId: user.id, archived: false },
      include: { logs: { where: { logDate: { gte: weekStart, lt: weekEnd } } } },
    }),
  ]);

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
    habits: habits.map((h) => ({ habitName: h.name, logDates: h.logs.map((l) => l.logDate) })),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Weekly {report.level === "advanced" ? "coach report" : "pattern summary"}
        </h1>
        <p className="mt-1 text-stone-600">
          Week of{" "}
          {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          {report.level === "basic" && " · Pro upgrades this to the advanced coach report."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm">
          <div className="text-3xl font-extrabold text-stone-900">{report.sessionsCount}</div>
          <div className="text-sm text-stone-500">sessions</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm">
          <div className="text-3xl font-extrabold text-stone-900">
            {report.sessionsCount > 0 ? `${report.averageScore}/100` : "—"}
          </div>
          <div className="text-sm text-stone-500">average alignment</div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-sm">
          <div className="text-lg font-bold text-stone-900">{report.topAreas || "—"}</div>
          <div className="text-sm text-stone-500">top areas</div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-stone-900">
          {report.level === "advanced" ? "Coach insights" : "This week"}
        </h2>
        <div className="prose-reading mt-2 text-stone-700">{report.insights}</div>
      </div>

      {report.patterns.recurringFearThemes.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-stone-900">Patterns to watch</h2>
          <ul className="mt-2 space-y-1 text-stone-700">
            {report.patterns.recurringFearThemes.map((theme) => (
              <li key={theme}>• {theme}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
