import Stripe from "stripe";
import type { PriceMap } from "@/lib/billing/sync";

let stripeClient: Stripe | null = null;

/** Lazy so builds/tests don't require STRIPE_SECRET_KEY. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}

export function getPriceMap(): PriceMap {
  const plus = process.env.STRIPE_PRICE_PLUS;
  const pro = process.env.STRIPE_PRICE_PRO;
  if (!plus || !pro) throw new Error("STRIPE_PRICE_PLUS / STRIPE_PRICE_PRO are not configured.");
  return { plus, pro };
}

export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
