import { prisma } from "@/lib/prisma";
import { requireUser, errorResponse, HttpError } from "@/lib/current-user";
import { getStripe, appUrl } from "@/lib/billing/stripe";

export async function POST() {
  try {
    const user = await requireUser();
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    if (!record?.stripeCustomerId) {
      throw new HttpError(400, "No billing account yet. Subscribe to Plus or Pro first.");
    }
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: record.stripeCustomerId,
      return_url: appUrl("/billing"),
    });
    return Response.json({ url: portal.url });
  } catch (error) {
    return errorResponse(error);
  }
}
