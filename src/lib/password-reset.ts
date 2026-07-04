// Password reset tokens: 32 random bytes, sha256-hashed at rest, 60-minute
// expiry, single use. Delegates to the generic token helpers in tokens.ts.

import {
  generateToken,
  hashToken,
  tokenHashesMatch as genericTokenHashesMatch,
  tokenIsValid,
  type StoredToken,
} from "@/lib/tokens";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): { token: string; tokenHash: string } {
  return generateToken();
}

export function hashResetToken(token: string): string {
  return hashToken(token);
}

export const tokenHashesMatch = genericTokenHashesMatch;

export type StoredResetToken = StoredToken;

export function resetTokenIsValid(stored: StoredResetToken, now: Date = new Date()): boolean {
  return tokenIsValid(stored, now);
}

export function resetUrl(token: string, baseUrl?: string): string {
  const base = (baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/auth/reset-password?token=${token}`;
}
