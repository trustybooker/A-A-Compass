import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/tiers";
import { UpgradeGate } from "@/components/UpgradeGate";
import { ReadingCard } from "@/components/ReadingCard";

export const metadata = { title: "Compass Reading" };
export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!hasFeature(user.tier, "cloud_history")) {
    return (
      <UpgradeGate
        requiredTier="plus"
        featureName="Saved readings"
        detail="Free sessions stay on your device. Plus saves every reading to your account so you can revisit, listen, and export."
      />
    );
  }

  const { id } = await params;
  const session = await prisma.compassSession.findFirst({
    where: { id, userId: user.id },
    include: { result: true },
  });
  if (!session?.result) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {session.area} · {session.result.alignmentMode}
          </h1>
          <p className="mt-1 text-stone-600">
            {session.createdAt.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" · "}score {session.result.score}/100
            {session.coachingMode ? ` · ${session.coachingMode} mode` : ""}
          </p>
        </div>
        <Link href="/history" className="text-sm font-medium text-amber-700 hover:underline">
          ← Back to history
        </Link>
      </div>
      <ReadingCard
        reading={{
          score: session.result.score,
          alignmentMode: session.result.alignmentMode,
          area: session.area,
          state: session.currentState,
          coachingMode: session.coachingMode,
          truthReflection: session.result.truthReflection,
          deeperValue: session.result.deeperValue,
          misalignmentToRelease: session.result.misalignmentToRelease,
          definiteVision: session.result.definiteVision,
          alignedAction: session.result.alignedAction,
          habitLoop: session.result.habitLoop,
          gratitudeAnchor: session.result.gratitudeAnchor,
          serviceAction: session.result.serviceAction,
          plan7Day: session.result.plan7Day,
          plan30Day: session.result.plan30Day,
          fullText: session.result.fullText,
        }}
        sessionId={session.id}
        tier={user.tier}
      />
    </div>
  );
}
