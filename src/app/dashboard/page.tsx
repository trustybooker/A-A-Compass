import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { dailySessionLimit, hasFeature, TIERS } from "@/lib/tiers";
import { startOfUtcDay } from "@/lib/sessions";
import { TierBadge } from "@/components/TierBadge";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";
import { emailConfigured } from "@/lib/email";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { verified } = await searchParams;

  const [todayCount, latest, habitCount, record] = await Promise.all([
    prisma.compassSession.count({
      where: { userId: user.id, createdAt: { gte: startOfUtcDay() } },
    }),
    hasFeature(user.tier, "cloud_history")
      ? prisma.compassSession.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          include: { result: { select: { score: true, alignmentMode: true } } },
        })
      : Promise.resolve(null),
    hasFeature(user.tier, "habit_tracking")
      ? prisma.habit.count({ where: { userId: user.id, archived: false } })
      : Promise.resolve(0),
    prisma.user.findUnique({ where: { id: user.id }, select: { emailVerifiedAt: true } }),
  ]);
  // Only nag about verification when the deployment can actually send email.
  const showVerifyBanner = !record?.emailVerifiedAt && emailConfigured() && verified !== "1";

  const limit = dailySessionLimit(user.tier);
  const freeUsedToday = Number.isFinite(limit) && todayCount >= limit;

  const cards: Array<{ href: string; title: string; body: string; locked?: string }> = [
    {
      href: "/session/new",
      title: freeUsedToday ? "Today's reading complete ✓" : "Run today's session",
      body: freeUsedToday
        ? "Your free daily reading is done. Return tomorrow, or upgrade for unlimited sessions."
        : "Truth, vision, one action, one habit, gratitude, and service — in a few minutes.",
    },
    {
      href: "/history",
      title: "History",
      body: hasFeature(user.tier, "cloud_history")
        ? "Review saved sessions and watch your patterns."
        : "Cloud history is part of Plus.",
      locked: hasFeature(user.tier, "cloud_history") ? undefined : "Plus",
    },
    {
      href: "/habits",
      title: "Habits & streaks",
      body: hasFeature(user.tier, "habit_tracking")
        ? `${habitCount} active habit${habitCount === 1 ? "" : "s"} — log today's loop.`
        : "Cloud habit tracking and streaks are part of Plus.",
      locked: hasFeature(user.tier, "habit_tracking") ? undefined : "Plus",
    },
    {
      href: "/weekly-report",
      title: "Weekly report",
      body: hasFeature(user.tier, "weekly_report_advanced")
        ? "Your advanced coach report with pattern memory."
        : hasFeature(user.tier, "weekly_report_basic")
          ? "Your weekly pattern summary."
          : "Weekly pattern reports are part of Plus.",
      locked: hasFeature(user.tier, "weekly_report_basic") ? undefined : "Plus",
    },
    {
      href: "/session/listen",
      title: "Listen mode",
      body: hasFeature(user.tier, "saved_listen_mode")
        ? "Have your saved readings read aloud."
        : "Saved listen mode is part of Plus.",
      locked: hasFeature(user.tier, "saved_listen_mode") ? undefined : "Plus",
    },
    {
      href: "/session/voice-pro",
      title: "A&A Aligned Voice Coach",
      body: hasFeature(user.tier, "pro_voice")
        ? "Realtime voice coaching with pattern memory."
        : "The premium realtime voice coach is part of Pro.",
      locked: hasFeature(user.tier, "pro_voice") ? undefined : "Pro",
    },
    {
      href: "/certification",
      title: "Certification pathway",
      body: hasFeature(user.tier, "certification_pathway")
        ? "Apply to become an A&A Compass Certified Alignment Coach."
        : "The certification pathway is available to Pro members (application required).",
      locked: hasFeature(user.tier, "certification_pathway") ? undefined : "Pro",
    },
  ];

  return (
    <div className="space-y-8">
      {verified === "1" && (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your email is verified. Welcome aboard.
        </p>
      )}
      {verified === "invalid" && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          That verification link is invalid or expired — you can resend a fresh one below.
        </p>
      )}
      {showVerifyBanner && <VerifyEmailBanner />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-stone-600">
            <TierBadge tier={user.tier} />
            <span>
              {TIERS[user.tier].tagline}{" "}
              {user.tier !== "pro" && (
                <Link href="/pricing" className="text-amber-700 hover:underline">
                  Upgrade
                </Link>
              )}
            </span>
          </p>
        </div>
        {latest?.result && (
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm shadow-sm">
            <div className="text-stone-500">Last session</div>
            <div className="font-semibold text-stone-900">
              {latest.result.alignmentMode} · {latest.result.score}/100 · {latest.area}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl shadow">
        <Image
          src="/images/home-office-dusk.webp"
          alt="A calm workspace at dusk"
          width={1600}
          height={640}
          className="h-40 w-full object-cover md:h-56"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href + card.title}
            href={card.href}
            className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-400 hover:shadow"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-stone-900 group-hover:text-amber-700">{card.title}</h2>
              {card.locked && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
                  {card.locked}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-stone-600">{card.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
