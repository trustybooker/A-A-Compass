import type Stripe from "stripe";
import { getStripe, getPriceMap } from "@/lib/billing/stripe";
import {
  applySubscriptionUpdate,
  applySubscriptionDeleted,
  type StripeSubscriptionStatus,
  type SubscriptionSnapshot,
} from "@/lib/billing/sync";
import { prismaBillingRepo } from "@/lib/billing/repo";

/**
 * Stripe API versions differ on where current_period_end lives (top level in
 * older versions, per-item since Basil). Read both defensively.
 */
function periodEnd(subscription: Stripe.Subscription): Date {
  const item = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end;
  const unix = item?.current_period_end ?? legacy;
  return unix ? new Date(unix * 1000) : new Date();
}

function toSnapshot(subscription: Stripe.Subscription): SubscriptionSnapshot {
  return {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripePriceId: subscription.items.data[0]?.price?.id ?? "",
    status: subscription.status as StripeSubscriptionStatus,
    currentPeriodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
  };
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Webhook not configured." }, { status: 500 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  const prices = getPriceMap();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await applySubscriptionUpdate(prismaBillingRepo, toSnapshot(subscription), prices);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      await applySubscriptionUpdate(prismaBillingRepo, toSnapshot(event.data.object), prices);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await applySubscriptionDeleted(prismaBillingRepo, {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id,
      });
      break;
    }
    default:
      break; // acknowledge everything else
  }

  return Response.json({ received: true });
}
