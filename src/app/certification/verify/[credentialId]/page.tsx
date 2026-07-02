import { prisma } from "@/lib/prisma";
import {
  isValidCredentialIdFormat,
  liveCredentialStatus,
} from "@/lib/certification/credential";
import { CERTIFICATION_NAME } from "@/lib/certification/pathway";

export const metadata = { title: "Verify credential" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  active: { badge: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "ACTIVE" },
  suspended: { badge: "bg-amber-100 text-amber-800 border-amber-300", label: "SUSPENDED" },
  revoked: { badge: "bg-red-100 text-red-800 border-red-300", label: "REVOKED" },
  expired: { badge: "bg-stone-200 text-stone-700 border-stone-300", label: "EXPIRED" },
};

/**
 * Public credential verification — the target of every certificate QR code.
 * Shows live status so a revoked or expired credential can never present as
 * active (docs/AA_Compass_v5_Certification_Blueprint.md).
 */
export default async function VerifyCredentialPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = await params;
  const normalized = credentialId.toUpperCase();

  const certification = isValidCredentialIdFormat(normalized)
    ? await prisma.certification.findUnique({ where: { credentialId: normalized } })
    : null;

  if (!certification) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-300 bg-white p-8 text-center shadow-sm">
        <div aria-hidden className="text-4xl">✕</div>
        <h1 className="mt-2 text-xl font-bold text-stone-900">Credential not found</h1>
        <p className="mt-2 text-stone-600">
          No {CERTIFICATION_NAME} credential exists with ID{" "}
          <span className="font-mono">{normalized}</span>. If someone presented this ID to you,
          treat it as invalid.
        </p>
      </div>
    );
  }

  const status = liveCredentialStatus(certification.status, certification.expiresAt);
  const style = STATUS_STYLES[status];

  // Record the verification view in the credential's event history (best-effort).
  await prisma.credentialEvent
    .create({
      data: { certificationId: certification.id, type: "VERIFICATION_VIEWED" },
    })
    .catch(() => undefined);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {CERTIFICATION_NAME}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-stone-900">
              {certification.holderName}
            </h1>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm font-bold ${style.badge}`}>
            {style.label}
          </span>
        </div>
        <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Credential ID</dt>
            <dd className="font-mono font-semibold text-stone-900">{certification.credentialId}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Issue date</dt>
            <dd>{certification.issuedAt.toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-stone-500">{status === "expired" ? "Expired" : "Renewal date"}</dt>
            <dd>{certification.expiresAt.toLocaleDateString()}</dd>
          </div>
          {certification.revokedAt && (
            <div>
              <dt className="text-stone-500">Revoked</dt>
              <dd>{certification.revokedAt.toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
        <p className="mt-6 text-xs text-stone-500">{certification.scope}</p>
        {status !== "active" && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
            This credential is currently {status.toUpperCase()} and must not be presented as an
            active certification.
          </p>
        )}
      </div>
      <p className="text-center text-xs text-stone-400">
        This page always reflects the live status of the credential. Certificates are
        non-transferable.
      </p>
    </div>
  );
}
