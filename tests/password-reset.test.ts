import { describe, it, expect } from "vitest";
import {
  generateResetToken,
  hashResetToken,
  tokenHashesMatch,
  resetTokenIsValid,
  resetUrl,
  RESET_TOKEN_TTL_MS,
} from "@/lib/password-reset";

describe("reset token generation", () => {
  it("generates unique tokens whose hash matches sha256 of the raw token", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).toBe(hashResetToken(a.token));
    expect(a.tokenHash).not.toBe(a.token); // raw token never equals what we store
    expect(a.token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("compares hashes in constant time and rejects mismatches", () => {
    const { token, tokenHash } = generateResetToken();
    expect(tokenHashesMatch(tokenHash, hashResetToken(token))).toBe(true);
    expect(tokenHashesMatch(tokenHash, hashResetToken("wrong-token"))).toBe(false);
  });
});

describe("reset token validity", () => {
  const now = new Date("2026-07-04T12:00:00Z");

  it("accepts an unused, unexpired token", () => {
    expect(
      resetTokenIsValid(
        { expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS), usedAt: null },
        now,
      ),
    ).toBe(true);
  });

  it("rejects an expired token", () => {
    expect(
      resetTokenIsValid({ expiresAt: new Date(now.getTime() - 1000), usedAt: null }, now),
    ).toBe(false);
  });

  it("rejects a used token — single use only", () => {
    expect(
      resetTokenIsValid(
        {
          expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
          usedAt: new Date(now.getTime() - 60_000),
        },
        now,
      ),
    ).toBe(false);
  });
});

describe("reset url", () => {
  it("builds the public reset link", () => {
    expect(resetUrl("abc123", "https://compass.example.com")).toBe(
      "https://compass.example.com/auth/reset-password?token=abc123",
    );
  });
});
