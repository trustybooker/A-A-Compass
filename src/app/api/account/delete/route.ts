import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, errorResponse } from "@/lib/current-user";
import { audit } from "@/lib/audit";
import { getStripe } from "@/lib/billing/stripe";

const deleteSchema = z.object({
  confirm: z.literal("DELETE"),
});

/**
 * Permanent account deletion. Cancels any active Stripe subscription first so
 * a deleted user is never billed again, then cascades all personal data; the
 * audit trail keeps an anonymized deletion record (userId is nulled by design —
 * audit rows have no FK cascade).
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Type "DELETE" to confirm.' }, { status: 400 });
    }

    // Stop billing before deleting data. Deleting the Stripe customer cancels
    // all of its subscriptions immediately and prevents any future charge.
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });
    if (record?.stripeCustomerId) {
      try {
        await getStripe().customers.del(record.stripeCustomerId);
      } catch (error) {
        // If Stripe is unreachable, do NOT delete the account — otherwise the
        // subscription would keep billing with no owner able to cancel it.
        console.error("[account.delete] failed to cancel Stripe customer", error);
        return Response.json(
          {
            error:
              "We could not cancel your subscription right now, so the account was not deleted. Please try again, or cancel the subscription from the Billing page first.",
          },
          { status: 502 },
        );
      }
    }

    await audit({
      userId: null, // anonymized by design — the account is about to disappear
      actorId: user.id,
      action: "account.deleted",
      metadata: { hadTier: user.tier, hadStripeCustomer: Boolean(record?.stripeCustomerId) },
    });
    await prisma.auditLog.updateMany({ where: { userId: user.id }, data: { userId: null } });
    await prisma.user.delete({ where: { id: user.id } });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
