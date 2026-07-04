// Generic single-use security tokens (password reset, email verification):
// 32 random bytes, sha256-hashed at rest, fixed TTL, one use.

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenHashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export interface StoredToken {
  expiresAt: Date;
  usedAt: Date | null;
}

export function tokenIsValid(stored: StoredToken, now: Date = new Date()): boolean {
  return stored.usedAt === null && stored.expiresAt.getTime() > now.getTime();
}
