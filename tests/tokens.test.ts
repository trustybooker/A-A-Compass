import { describe, it, expect } from "vitest";
import { generateToken, hashToken, tokenIsValid } from "@/lib/tokens";
import { generateResetToken, hashResetToken, resetTokenIsValid } from "@/lib/password-reset";

describe("generic security tokens", () => {
  it("generates 32-byte hex tokens with sha256 hashes", () => {
    const { token, tokenHash } = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toBe(hashToken(token));
  });

  it("validity requires unused and unexpired", () => {
    const now = new Date("2026-07-05T12:00:00Z");
    const future = new Date(now.getTime() + 60_000);
    const past = new Date(now.getTime() - 60_000);
    expect(tokenIsValid({ expiresAt: future, usedAt: null }, now)).toBe(true);
    expect(tokenIsValid({ expiresAt: past, usedAt: null }, now)).toBe(false);
    expect(tokenIsValid({ expiresAt: future, usedAt: past }, now)).toBe(false);
  });

  it("password-reset helpers stay behaviorally identical after delegation", () => {
    const { token, tokenHash } = generateResetToken();
    expect(hashResetToken(token)).toBe(tokenHash);
    expect(hashResetToken(token)).toBe(hashToken(token));
    expect(
      resetTokenIsValid({ expiresAt: new Date(Date.now() + 1000), usedAt: null }),
    ).toBe(true);
  });
});
