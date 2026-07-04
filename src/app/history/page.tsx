import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/tiers";
import { UpgradeGate } from "@/components/UpgradeGate";

export const metadata = { title: "History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!hasFeature(user.tier, "cloud_history")) {
    return (
      <UpgradeGate
        requiredTier="plus"
        featureName="Cloud history"
        detail="Free sessions stay on your device. Plus saves every session to your account with streaks, exports, and pattern summaries."
      />
    );
  }

  const [sessions, voiceSessions] = await Promise.all([
    prisma.compassSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { result: { select: { score: true, alignmentMode: true, fullText: true } } },
    }),
    hasFeature(user.tier, "pro_voice")
      ? prisma.voiceSession.findMany({
          where: { userId: user.id, summary: { not: null } },
          orderBy: { startedAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Session history</h1>
        <Link
          href="/session/new"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          New session
        </Link>
      </div>
      {sessions.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-600">
          No saved sessions yet. Run a Compass session and it will appear here.
        </p>
      ) : (
        <ul className="space-y-4">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-500">
                <span>
                  {session.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · {session.area} · {session.currentState}
                  {session.coachingMode ? ` · ${session.coachingMode} mode` : ""}
                </span>
                {session.result && (
                  <span className="font-semibold text-stone-700">
                    {session.result.alignmentMode} · {session.result.score}/100
                  </span>
                )}
              </div>
              {session.result && (
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-stone-600">
                  {session.result.fullText.slice(0, 400)}…
                </p>
              )}
              <div className="mt-3 flex gap-4 text-sm">
                <Link
                  href={`/session/${session.id}`}
                  className="font-medium text-amber-700 hover:underline"
                >
                  Open full reading
                </Link>
                <a
                  href={`/api/sessions/${session.id}/export`}
                  className="font-medium text-amber-700 hover:underline"
                >
                  Export .txt
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {voiceSessions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-stone-900">Voice coaching sessions</h2>
          <ul className="mt-3 space-y-4">
            {voiceSessions.map((voice) => (
              <li key={voice.id} className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
                <div className="text-sm text-stone-500">
                  {voice.startedAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · A&amp;A Aligned Voice Coach
                </div>
                <p className="prose-reading mt-2 max-h-48 overflow-y-auto text-sm text-stone-700">
                  {voice.summary}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
