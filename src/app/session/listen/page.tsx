import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { hasFeature } from "@/lib/tiers";
import { UpgradeGate } from "@/components/UpgradeGate";
import { ListenMode } from "@/components/ListenMode";

export const metadata = { title: "Listen mode" };
export const dynamic = "force-dynamic";

export default async function ListenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!hasFeature(user.tier, "saved_listen_mode")) {
    return (
      <UpgradeGate
        requiredTier="plus"
        featureName="Saved listen mode"
        detail="Free includes browser read-aloud on the reading you just generated. Plus saves every session so you can listen back anytime."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Listen mode</h1>
        <p className="mt-1 text-stone-600">Have your saved Compass Readings read aloud.</p>
      </div>
      <ListenMode />
    </div>
  );
}
