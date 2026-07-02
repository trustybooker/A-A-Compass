// Credential identity + verification helpers.
// Anti-duplication design (docs/AA_Compass_v5_Certification_Blueprint.md):
// server-generated credential ID, QR code to the public verify page, and a
// public status page that always reflects live revocation/suspension state.

import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

function randomBlock(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** e.g. AAC-7XK2M-9QF4T */
export function generateCredentialId(): string {
  return `AAC-${randomBlock(5)}-${randomBlock(5)}`;
}

export const CREDENTIAL_ID_PATTERN = /^AAC-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

export function isValidCredentialIdFormat(id: string): boolean {
  return CREDENTIAL_ID_PATTERN.test(id);
}

export function verificationUrl(credentialId: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/certification/verify/${credentialId}`;
}

export type PublicCredentialStatus = "active" | "suspended" | "revoked" | "expired";

/** Live status: expiry always wins over a stale ACTIVE row; revocation is terminal. */
export function liveCredentialStatus(
  stored: "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED",
  expiresAt: Date,
  now: Date = new Date(),
): PublicCredentialStatus {
  if (stored === "REVOKED") return "revoked";
  if (stored === "SUSPENDED") return "suspended";
  if (stored === "EXPIRED" || expiresAt.getTime() < now.getTime()) return "expired";
  return "active";
}
