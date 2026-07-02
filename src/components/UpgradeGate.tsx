import Link from "next/link";
import type { TierId } from "@/lib/tiers";
import { TIERS } from "@/lib/tiers";

/**
 * Friendly lock screen for pages above the user's tier. This is UX only —
 * the real enforcement lives in the API routes and server components.
 */
export function UpgradeGate({
  requiredTier,
  featureName,
  detail,
}: {
  requiredTier: Exclude<TierId, "free">;
  featureName: string;
  detail?: string;
}) {
  const tier = TIERS[requiredTier];
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <div aria-hidden className="mb-3 text-4xl">🔒</div>
      <h1 className="text-xl font-bold text-stone-900">{featureName} is a {tier.label} feature</h1>
      {detail && <p className="mt-2 text-stone-600">{detail}</p>}
      <p className="mt-2 text-stone-600">
        {tier.label} is ${tier.priceMonthly}/month. {tier.tagline}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/pricing"
          className="rounded-lg bg-amber-600 px-5 py-2.5 font-medium text-white hover:bg-amber-700"
        >
          See plans
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-stone-300 px-5 py-2.5 font-medium text-stone-700 hover:bg-stone-50"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
