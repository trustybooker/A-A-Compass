import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { TIERS } from "@/lib/tiers";
import { TierBadge } from "@/components/TierBadge";
import { ManageBillingButton } from "@/components/BillingActions";
import { CheckoutButton } from "@/components/CheckoutButton";

export const metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { status } = await searchParams;

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Billing</h1>

      {status === "success" && (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
          Thank you! Your subscription is being activated — entitlements update within moments of
          Stripe confirming payment.
        </p>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-stone-500">Current plan</div>
            <div className="mt-1 flex items-center gap-2 text-xl font-bold text-stone-900">
              {TIERS[user.tier].label} <TierBadge tier={user.tier} />
            </div>
            <div className="text-stone-600">${TIERS[user.tier].priceMonthly}/month</div>
          </div>
        </div>
        {subscription && (
          <div className="mt-4 grid gap-2 border-t border-stone-100 pt-4 text-sm text-stone-600 sm:grid-cols-2">
            <div>
              Status: <span className="font-medium">{subscription.status.toLowerCase()}</span>
            </div>
            <div>
              {subscription.cancelAtPeriodEnd ? "Access ends" : "Renews"}:{" "}
              <span className="font-medium">
                {subscription.currentPeriodEnd.toLocaleDateString()}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <p className="sm:col-span-2">
                Your plan is set to cancel — access continues until the end of the paid period.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {user.tier !== "pro" && (
          <CheckoutButton
            tier="pro"
            signedIn
            label="Upgrade to Pro — $99/mo"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
          />
        )}
        {user.tier === "free" && (
          <CheckoutButton
            tier="plus"
            signedIn
            label="Upgrade to Plus — $19/mo"
            className="rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-700"
          />
        )}
        {subscription && <ManageBillingButton />}
      </div>

      <p className="text-sm text-stone-500">
        Monthly billing only — no annual plans, lifetime deals, or trials. Cancel anytime in the
        Stripe portal; access continues to the end of the paid period, then your account returns to
        Free.
      </p>
    </div>
  );
}
