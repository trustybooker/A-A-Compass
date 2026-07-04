// Password reset tokens: 32 random bytes, sha256-hashed at rest, 60-minute
// expiry, single use. Pure helpers here; persistence lives in the routes.

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenHashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export interface StoredResetToken {
  expiresAt: Date;
  usedAt: Date | null;
}

export function resetTokenIsValid(stored: StoredResetToken, now: Date = new Date()): boolean {
  return stored.usedAt === null && stored.expiresAt.getTime() > now.getTime();
}

export function resetUrl(token: string, baseUrl?: string): string {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/auth/reset-password?token=${token}`;
}
