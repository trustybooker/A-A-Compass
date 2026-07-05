import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, errorResponse } from "@/lib/current-user";
import { getStripe, getPriceMap, appUrl } from "@/lib/billing/stripe";
import { audit } from "@/lib/audit";

const checkoutSchema = z.object({
  tier: z.enum(["plus", "pro"]), // exactly the two paid public tiers — nothing else is sellable
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid tier." }, { status: 400 });
    }
    const tier = parsed.data.tier;

    // Duplicate-subscription guard: a user with a live subscription must
    // switch plans through the Stripe Customer Portal (which updates the
    // existing subscription) — a second Checkout would create a second,
    // separately-billed subscription.
    const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (existing && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(existing.status)) {
      return Response.json(
        {
          error:
            "You already have an active subscription. Use “Manage subscription” on the Billing page to switch between Plus and Pro — this prevents duplicate charges.",
        },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    const prices = getPriceMap();

    // Reuse the Stripe customer across upgrades/downgrades.
    let customerId = (
      await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } })
    )?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: tier === "plus" ? prices.plus : prices.pro, quantity: 1 }],
      subscription_data: { metadata: { userId: user.id, tier } },
      success_url: appUrl("/billing?status=success"),
      cancel_url: appUrl("/pricing?status=canceled"),
      allow_promotion_codes: false,
    });

    await audit({
      userId: user.id,
      action: "billing.checkout_started",
      metadata: { tier, checkoutSessionId: checkout.id },
    });

    return Response.json({ url: checkout.url });
  } catch (error) {
    return errorResponse(error);
  }
}
