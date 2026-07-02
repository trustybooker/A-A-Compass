// Prisma-backed implementation of the BillingRepo used by webhook sync logic.

import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { tierFromDb, tierToDb, type TierId } from "@/lib/tiers";
import {
  SUBSCRIPTION_STATUS_TO_DB,
  type BillingRepo,
  type StripeSubscriptionStatus,
} from "@/lib/billing/sync";

export const prismaBillingRepo: BillingRepo = {
  async findUserByStripeCustomerId(customerId: string) {
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true, tier: true },
    });
    return user ? { id: user.id, tier: tierFromDb(user.tier) } : null;
  },

  async upsertSubscription(
    userId: string,
    data: {
      stripeSubscriptionId: string;
      stripePriceId: string;
      status: StripeSubscriptionStatus;
      tier: TierId;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
    },
  ) {
    const record = {
      stripePriceId: data.stripePriceId,
      status: SUBSCRIPTION_STATUS_TO_DB[data.status],
      tier: tierToDb(data.tier),
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    };
    await prisma.subscription.upsert({
      where: { userId },
      update: { stripeSubscriptionId: data.stripeSubscriptionId, ...record },
      create: { userId, stripeSubscriptionId: data.stripeSubscriptionId, ...record },
    });
  },

  async deleteSubscription(stripeSubscriptionId: string) {
    await prisma.subscription.deleteMany({ where: { stripeSubscriptionId } });
  },

  async setUserTier(userId: string, tier: TierId) {
    await prisma.user.update({ where: { id: userId }, data: { tier: tierToDb(tier) } });
  },

  async audit(entry) {
    await audit(entry);
  },
};
