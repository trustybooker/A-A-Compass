// A&A Compass v5 — Stripe subscription -> entitlement sync.
// Pure logic separated from Prisma/Stripe so it is fully unit-testable.
// Server-side entitlements are the source of truth; client locks are UX only.

import type { TierId } from "@/lib/tiers";

export type StripeSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface SubscriptionSnapshot {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status: StripeSubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface PriceMap {
  plus: string;
  pro: string;
}

/** Map a Stripe price id to the tier it purchases. Unknown prices grant nothing. */
export function tierForPrice(priceId: string, prices: PriceMap): TierId | null {
  if (priceId === prices.plus) return "plus";
  if (priceId === prices.pro) return "pro";
  return null;
}

/**
 * Derive the entitlement tier a subscription grants RIGHT NOW.
 * - active/trialing: full paid tier.
 * - past_due: grace — access continues until Stripe cancels (dunning handles it).
 * - cancel_at_period_end with active status: access continues until period end
 *   (docs/AA_Compass_v5_Test_Plan.md: "Cancellation downgrades access after period end").
 * - canceled/unpaid/incomplete/expired/paused: free.
 */
export function entitledTier(snapshot: SubscriptionSnapshot, prices: PriceMap, now: Date = new Date()): TierId {
  const purchased = tierForPrice(snapshot.stripePriceId, prices);
  if (!purchased) return "free";
  switch (snapshot.status) {
    case "active":
    case "trialing":
    case "past_due":
      // Still within the paid period (Stripe transitions to canceled/unpaid when it truly lapses).
      return snapshot.currentPeriodEnd.getTime() >= now.getTime() || snapshot.status !== "past_due"
        ? purchased
        : "free";
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "free";
    default:
      return "free";
  }
}

export const SUBSCRIPTION_STATUS_TO_DB: Record<
  StripeSubscriptionStatus,
  "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "UNPAID" | "PAUSED"
> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  unpaid: "UNPAID",
  paused: "PAUSED",
};

// ---------------------------------------------------------------------------
// Repository interface so webhook logic is testable without a database.
// ---------------------------------------------------------------------------

export interface BillingRepo {
  findUserByStripeCustomerId(customerId: string): Promise<{ id: string; tier: TierId } | null>;
  upsertSubscription(
    userId: string,
    data: {
      stripeSubscriptionId: string;
      stripePriceId: string;
      status: StripeSubscriptionStatus;
      tier: TierId;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
    },
  ): Promise<void>;
  deleteSubscription(stripeSubscriptionId: string): Promise<void>;
  setUserTier(userId: string, tier: TierId): Promise<void>;
  audit(entry: { userId: string; action: string; metadata?: Record<string, unknown> }): Promise<void>;
}

/**
 * Apply a subscription create/update event. Updates the subscription record
 * and the user's denormalized tier, and writes an audit entry when the
 * entitlement actually changes.
 */
export async function applySubscriptionUpdate(
  repo: BillingRepo,
  snapshot: SubscriptionSnapshot,
  prices: PriceMap,
  now: Date = new Date(),
): Promise<{ userId: string; tier: TierId } | null> {
  const user = await repo.findUserByStripeCustomerId(snapshot.stripeCustomerId);
  if (!user) return null;

  const purchased = tierForPrice(snapshot.stripePriceId, prices) ?? "free";
  const tierNow = entitledTier(snapshot, prices, now);
  const previousTier = user.tier; // capture before any repo mutation

  await repo.upsertSubscription(user.id, {
    stripeSubscriptionId: snapshot.stripeSubscriptionId,
    stripePriceId: snapshot.stripePriceId,
    status: snapshot.status,
    tier: purchased,
    currentPeriodEnd: snapshot.currentPeriodEnd,
    cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
  });

  if (previousTier !== tierNow) {
    await repo.setUserTier(user.id, tierNow);
    await repo.audit({
      userId: user.id,
      action: "billing.entitlement_changed",
      metadata: {
        from: previousTier,
        to: tierNow,
        stripeSubscriptionId: snapshot.stripeSubscriptionId,
        status: snapshot.status,
      },
    });
  }
  return { userId: user.id, tier: tierNow };
}

/**
 * Apply a customer.subscription.deleted event: remove the record and drop the
 * user back to Free (period has ended when Stripe emits this).
 */
export async function applySubscriptionDeleted(
  repo: BillingRepo,
  params: { stripeSubscriptionId: string; stripeCustomerId: string },
): Promise<{ userId: string } | null> {
  const user = await repo.findUserByStripeCustomerId(params.stripeCustomerId);
  await repo.deleteSubscription(params.stripeSubscriptionId);
  if (!user) return null;
  const previousTier = user.tier;
  if (previousTier !== "free") {
    await repo.setUserTier(user.id, "free");
    await repo.audit({
      userId: user.id,
      action: "billing.entitlement_changed",
      metadata: { from: previousTier, to: "free", reason: "subscription_deleted" },
    });
  }
  return { userId: user.id };
}
