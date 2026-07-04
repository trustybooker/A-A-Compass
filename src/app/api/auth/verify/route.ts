import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { hashToken, tokenIsValid } from "@/lib/tokens";
import { appUrl } from "@/lib/billing/stripe";

/**
 * Email verification landing (linked from the verification email).
 * GET with a redirect is the standard pattern for email links.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length < 32 || token.length > 128) {
    return Response.redirect(appUrl("/dashboard?verified=invalid"), 302);
  }

  const stored = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!stored || !tokenIsValid(stored)) {
    return Response.redirect(appUrl("/dashboard?verified=invalid"), 302);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: stored.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.updateMany({
      where: { userId: stored.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
  await audit({ userId: stored.userId, action: "auth.email_verified" });

  return Response.redirect(appUrl("/dashboard?verified=1"), 302);
}
