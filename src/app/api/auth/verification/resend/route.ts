import { prisma } from "@/lib/prisma";
import { requireUser, errorResponse } from "@/lib/current-user";
import { sendVerificationEmail } from "@/lib/verification";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { prismaRateLimitStore } from "@/lib/rate-limit-store";

export async function POST() {
  try {
    const user = await requireUser();
    const limit = await rateLimit(prismaRateLimitStore, {
      key: `verify-resend:user:${user.id}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) return tooManyRequests(limit);

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerifiedAt: true },
    });
    if (record?.emailVerifiedAt) {
      return Response.json({ ok: true, message: "Your email is already verified." });
    }
    await sendVerificationEmail({ id: user.id, email: user.email });
    return Response.json({
      ok: true,
      message: "Verification email sent. Check your inbox — the link expires in 24 hours.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
