import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { hasFeature } from "@/lib/tiers";
import { UpgradeGate } from "@/components/UpgradeGate";
import { HabitsPanel } from "@/components/HabitsPanel";

export const metadata = { title: "Habits & streaks" };
export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!hasFeature(user.tier, "habit_tracking")) {
    return (
      <UpgradeGate
        requiredTier="plus"
        featureName="Habits & streaks"
        detail="On Free, keep your habit loop on paper or in your notes — the reading gives you one every day. Plus adds cloud habit tracking, streaks, and reminders."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Habits &amp; streaks</h1>
        <p className="mt-1 text-stone-600">
          Habit shapes destiny. Log the loop daily — small, kept promises compound.
        </p>
      </div>
      <HabitsPanel />
    </div>
  );
}
