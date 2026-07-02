import { describe, it, expect, beforeEach } from "vitest";
import {
  tierForPrice,
  entitledTier,
  applySubscriptionUpdate,
  applySubscriptionDeleted,
  type BillingRepo,
  type SubscriptionSnapshot,
} from "@/lib/billing/sync";
import type { TierId } from "@/lib/tiers";

const PRICES = { plus: "price_plus_19", pro: "price_pro_99" };

function snapshot(overrides: Partial<SubscriptionSnapshot> = {}): SubscriptionSnapshot {
  return {
    stripeSubscriptionId: "sub_123",
    stripeCustomerId: "cus_123",
    stripePriceId: PRICES.pro,
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

class FakeRepo implements BillingRepo {
  users = new Map<string, { id: string; tier: TierId }>();
  customerIndex = new Map<string, string>();
  subscriptions = new Map<string, unknown>();
  auditEntries: Array<{ userId: string; action: string; metadata?: Record<string, unknown> }> = [];

  addUser(id: string, customerId: string, tier: TierId) {
    this.users.set(id, { id, tier });
    this.customerIndex.set(customerId, id);
  }
  async findUserByStripeCustomerId(customerId: string) {
    const userId = this.customerIndex.get(customerId);
    return userId ? (this.users.get(userId) ?? null) : null;
  }
  async upsertSubscription(userId: string, data: unknown) {
    this.subscriptions.set(userId, data);
  }
  async deleteSubscription(stripeSubscriptionId: string) {
    for (const [userId, sub] of this.subscriptions) {
      if ((sub as { stripeSubscriptionId: string }).stripeSubscriptionId === stripeSubscriptionId) {
        this.subscriptions.delete(userId);
      }
    }
  }
  async setUserTier(userId: string, tier: TierId) {
    const user = this.users.get(userId);
    if (user) user.tier = tier;
  }
  async audit(entry: { userId: string; action: string; metadata?: Record<string, unknown> }) {
    this.auditEntries.push(entry);
  }
}

describe("price -> tier mapping", () => {
  it("maps configured prices and rejects unknown ones", () => {
    expect(tierForPrice(PRICES.plus, PRICES)).toBe("plus");
    expect(tierForPrice(PRICES.pro, PRICES)).toBe("pro");
    expect(tierForPrice("price_hacked", PRICES)).toBeNull();
  });
});

describe("entitlement derivation", () => {
  it("grants the paid tier for active and trialing subscriptions", () => {
    expect(entitledTier(snapshot({ status: "active" }), PRICES)).toBe("pro");
    expect(entitledTier(snapshot({ status: "trialing", stripePriceId: PRICES.plus }), PRICES)).toBe("plus");
  });

  it("keeps access when canceled at period end but period not over (downgrade AFTER period end)", () => {
    expect(entitledTier(snapshot({ cancelAtPeriodEnd: true, status: "active" }), PRICES)).toBe("pro");
  });

  it("drops to free for lapsed statuses", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"] as const) {
      expect(entitledTier(snapshot({ status }), PRICES)).toBe("free");
    }
  });

  it("never grants a tier for an unknown price id", () => {
    expect(entitledTier(snapshot({ stripePriceId: "price_fake" }), PRICES)).toBe("free");
  });
});

describe("webhook subscription sync", () => {
  let repo: FakeRepo;
  beforeEach(() => {
    repo = new FakeRepo();
    repo.addUser("user_1", "cus_123", "free");
  });

  it("upgrades the user when a pro subscription activates and audits the change", async () => {
    const result = await applySubscriptionUpdate(repo, snapshot(), PRICES);
    expect(result).toEqual({ userId: "user_1", tier: "pro" });
    expect(repo.users.get("user_1")!.tier).toBe("pro");
    expect(repo.subscriptions.has("user_1")).toBe(true);
    expect(repo.auditEntries).toHaveLength(1);
    expect(repo.auditEntries[0].action).toBe("billing.entitlement_changed");
    expect(repo.auditEntries[0].metadata).toMatchObject({ from: "free", to: "pro" });
  });

  it("upgrades to plus for the plus price", async () => {
    await applySubscriptionUpdate(repo, snapshot({ stripePriceId: PRICES.plus }), PRICES);
    expect(repo.users.get("user_1")!.tier).toBe("plus");
  });

  it("does not audit when the tier is unchanged", async () => {
    await applySubscriptionUpdate(repo, snapshot(), PRICES);
    repo.auditEntries = [];
    await applySubscriptionUpdate(repo, snapshot(), PRICES); // same event again
    expect(repo.auditEntries).toHaveLength(0);
  });

  it("ignores events for unknown customers", async () => {
    const result = await applySubscriptionUpdate(
      repo,
      snapshot({ stripeCustomerId: "cus_unknown" }),
      PRICES,
    );
    expect(result).toBeNull();
  });

  it("downgrades to free when the subscription is deleted (period ended)", async () => {
    await applySubscriptionUpdate(repo, snapshot(), PRICES);
    expect(repo.users.get("user_1")!.tier).toBe("pro");

    await applySubscriptionDeleted(repo, {
      stripeSubscriptionId: "sub_123",
      stripeCustomerId: "cus_123",
    });
    expect(repo.users.get("user_1")!.tier).toBe("free");
    expect(repo.subscriptions.has("user_1")).toBe(false);
    const last = repo.auditEntries.at(-1)!;
    expect(last.metadata).toMatchObject({ to: "free", reason: "subscription_deleted" });
  });
});
