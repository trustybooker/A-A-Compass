// Email verification (soft): tracked and surfaced, never blocking.
// Uses the same single-use hashed-token pattern as password reset.

import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { sendEmail, emailConfigured } from "@/lib/email";

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function verificationUrlFor(token: string, baseUrl?: string): string {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/auth/verify?token=${token}`;
}

/**
 * Create a verification token and (best-effort) email it. Never throws —
 * registration and resends must succeed even if email is down.
 */
export async function sendVerificationEmail(user: { id: string; email: string }): Promise<void> {
  try {
    const { token, tokenHash } = generateToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });
    const url = verificationUrlFor(token);
    const sent = await sendEmail({
      to: user.email,
      subject: "Verify your A&A Compass email",
      text: [
        "Welcome to A&A Compass.",
        "",
        `Verify your email address: ${url}`,
        "",
        "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
      ].join("\n"),
    });
    if (!sent && !emailConfigured()) {
      console.log(`[verification] email not configured; verify URL for ${user.email}: ${url}`);
    }
  } catch (error) {
    console.error("[verification] failed to create/send verification token", error);
  }
}
