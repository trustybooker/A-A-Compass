import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/tiers";
import { UpgradeGate } from "@/components/UpgradeGate";
import { CertificationPathway } from "@/components/CertificationPathway";
import {
  CERTIFICATION_NAME,
  pathwaySteps,
  writtenAssessmentForClient,
  REVOCATION_TRIGGERS,
} from "@/lib/certification/pathway";
import { verificationUrl, liveCredentialStatus } from "@/lib/certification/credential";

export const metadata = { title: "Certification" };
export const dynamic = "force-dynamic";

export default async function CertificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  if (!hasFeature(user.tier, "certification_pathway")) {
    return (
      <UpgradeGate
        requiredTier="pro"
        featureName="The certification pathway"
        detail="Pro members may APPLY to become an A&A Compass Certified Alignment Coach. The credential itself is never automatic — it requires training, assessment, supervised review, and staff approval."
      />
    );
  }

  const [application, certification] = await Promise.all([
    prisma.certificationApplication.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.certification.findFirst({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  // Credential holder view
  if (certification) {
    const status = liveCredentialStatus(certification.status, certification.expiresAt);
    const verifyUrl = verificationUrl(certification.credentialId);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 });
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-stone-900">Your credential</h1>
        <div className="rounded-2xl border-2 border-emerald-500 bg-white p-8 shadow">
          <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {CERTIFICATION_NAME}
          </div>
          <div className="mt-2 text-2xl font-extrabold text-stone-900">{certification.holderName}</div>
          <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Credential ID</dt>
              <dd className="font-mono font-semibold text-stone-900">{certification.credentialId}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Status</dt>
              <dd
                className={`font-semibold ${
                  status === "active" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {status.toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Issued</dt>
              <dd>{certification.issuedAt.toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-stone-500">
                {status === "expired" ? "Expired" : "Renewal due"}
              </dt>
              <dd>{certification.expiresAt.toLocaleDateString()}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-stone-500">{certification.scope}</p>
          <p className="mt-1 text-xs text-stone-500">
            Non-transferable. Verify at{" "}
            <a href={verifyUrl} className="text-emerald-700 underline">
              {verifyUrl}
            </a>
          </p>
          <div className="mt-4 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Credential verification QR code" className="h-28 w-28" />
            <p className="text-sm text-stone-600">
              Anyone can scan this QR code to verify the credential&apos;s live status — including
              suspension, revocation, and expiry.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">
          <h2 className="font-semibold text-stone-900">Keeping the credential</h2>
          <p className="mt-1">
            Annual renewal requires ethics recommitment, a short renewal assessment, and evidence of
            continued practice. The credential can be revoked for:
          </p>
          <ul className="mt-2 space-y-1">
            {REVOCATION_TRIGGERS.map((trigger) => (
              <li key={trigger}>• {trigger}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const steps = application
    ? pathwaySteps({
        status: application.status,
        ethicsAgreedAt: application.ethicsAgreedAt,
        identitySubmittedAt: application.identitySubmittedAt,
        identityVerifiedAt: application.identityVerifiedAt,
        trainingModulesCompleted: application.trainingModulesCompleted,
        trainingCompletedAt: application.trainingCompletedAt,
        writtenScore: application.writtenScore,
        writtenPassedAt: application.writtenPassedAt,
        practicalSubmitted: application.practicalTranscript !== null,
        practicalScore: application.practicalScore,
        practicalPassedAt: application.practicalPassedAt,
        supervisedReviewPassedAt: application.supervisedReviewPassedAt,
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{CERTIFICATION_NAME}</h1>
        <p className="mt-1 text-stone-600">
          A proprietary coaching-method certification for the A&amp;A Compass system. It is not a
          therapy license, financial advisor license, medical credential, legal credential, or ICF
          credential — and subscribing to Pro does not grant it. Every step below is required.
        </p>
        {application?.status === "REJECTED" && (
          <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Your previous application was not approved
            {application.decisionNotes ? `: ${application.decisionNotes}` : "."} You may apply
            again.
          </p>
        )}
      </div>
      <CertificationPathway
        hasApplication={
          application !== null &&
          ["SUBMITTED", "IN_PROGRESS", "UNDER_REVIEW"].includes(application.status)
        }
        steps={steps}
        trainingModulesCompleted={application?.trainingModulesCompleted ?? 0}
        ethicsAgreed={application?.ethicsAgreedAt != null}
        identitySubmitted={application?.identitySubmittedAt != null}
        trainingComplete={application?.trainingCompletedAt != null}
        writtenPassed={application?.writtenPassedAt != null}
        writtenScore={application?.writtenScore ?? null}
        practicalSubmitted={application?.practicalTranscript != null}
        questions={writtenAssessmentForClient()}
      />
    </div>
  );
}
