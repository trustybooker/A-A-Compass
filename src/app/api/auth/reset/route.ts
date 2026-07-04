import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { hashResetToken, resetTokenIsValid } from "@/lib/password-reset";
import { rateLimit, clientIpFrom, tooManyRequests } from "@/lib/rate-limit";
import { prismaRateLimitStore } from "@/lib/rate-limit-store";

const resetSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

/** Complete a password reset with a valid, unexpired, unused token. */
export async function POST(req: Request) {
  const ip = clientIpFrom(req);
  const ipLimit = await rateLimit(prismaRateLimitStore, {
    key: `reset:ip:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) return tooManyRequests(ipLimit);

  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!stored || !resetTokenIsValid(stored)) {
    return Response.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: stored.id },
      data: { usedAt: new Date() },
    }),
    // Any other outstanding tokens die with this reset.
    prisma.passwordResetToken.updateMany({
      where: { userId: stored.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
  await audit({ userId: stored.userId, action: "auth.password_reset_completed" });

  return Response.json({ ok: true });
}
