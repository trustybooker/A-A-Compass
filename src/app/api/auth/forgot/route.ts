import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { generateResetToken, RESET_TOKEN_TTL_MS, resetUrl } from "@/lib/password-reset";
import { sendEmail, emailConfigured } from "@/lib/email";
import { rateLimit, clientIpFrom, tooManyRequests } from "@/lib/rate-limit";
import { prismaRateLimitStore } from "@/lib/rate-limit-store";

const forgotSchema = z.object({ email: z.string().email().max(200) });

const GENERIC_RESPONSE = {
  ok: true,
  message:
    "If an account exists for that email, a password reset link has been sent. It expires in 1 hour.",
};

/**
 * Request a password reset. Always answers generically so the endpoint can't
 * be used to probe which emails have accounts.
 */
export async function POST(req: Request) {
  const ip = clientIpFrom(req);
  const ipLimit = await rateLimit(prismaRateLimitStore, {
    key: `forgot:ip:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok) return tooManyRequests(ipLimit);

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const emailLimit = await rateLimit(prismaRateLimitStore, {
    key: `forgot:email:${email}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!emailLimit.ok) return tooManyRequests(emailLimit);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const { token, tokenHash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });
    const url = resetUrl(token);
    const sent = await sendEmail({
      to: email,
      subject: "Reset your A&A Compass password",
      text: [
        "Someone (hopefully you) requested a password reset for your A&A Compass account.",
        "",
        `Reset your password: ${url}`,
        "",
        "This link expires in 1 hour and can be used once. If you didn't request it, you can safely ignore this email — your password is unchanged.",
      ].join("\n"),
    });
    if (!sent && !emailConfigured()) {
      // Deployment without email: surface the URL in server logs only, so an
      // operator can still complete a support-driven reset. Never in the response.
      console.log(`[password-reset] email not configured; reset URL for ${email}: ${url}`);
    }
    await audit({ userId: user.id, action: "auth.password_reset_requested" });
  }

  return Response.json(GENERIC_RESPONSE);
}
