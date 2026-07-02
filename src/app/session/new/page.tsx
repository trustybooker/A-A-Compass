import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { NewSessionForm } from "@/components/NewSessionForm";
import { TierBadge } from "@/components/TierBadge";

export const metadata = { title: "New Compass session" };
export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-stone-900">
          New Compass session <TierBadge tier={user.tier} />
        </h1>
        <p className="mt-1 text-stone-600">
          Answer honestly — the compass works with what is true, not what sounds good.
          {user.tier === "free" && " Free includes one reading per day."}
        </p>
      </div>
      <NewSessionForm tier={user.tier} />
    </div>
  );
}
