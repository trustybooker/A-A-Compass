import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { CERTIFICATION_NAME } from "@/lib/certification/pathway";
import { verificationUrl, liveCredentialStatus } from "@/lib/certification/credential";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Certificate" };
export const dynamic = "force-dynamic";

/**
 * Print-optimized certificate (docs/AA_Compass_v5_Certification_Blueprint.md):
 * credential ID, signature block, verification URL + QR, and a
 * non-transferability notice. Only renders for a live-ACTIVE credential —
 * suspended/revoked/expired holders are sent back to their status page.
 */
export default async function CertificatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const certification = await prisma.certification.findFirst({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });
  if (!certification) redirect("/certification");
  const status = liveCredentialStatus(certification.status, certification.expiresAt);
  if (status !== "active") redirect("/certification");

  const verifyUrl = verificationUrl(certification.credentialId);
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/certification" className="text-sm font-medium text-amber-700 hover:underline">
          ← Back to certification
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-none border-4 border-double border-emerald-700 bg-white p-10 text-center shadow-sm print:border-2 print:shadow-none">
        <div className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
          A&amp;A Compass
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-stone-900">{CERTIFICATION_NAME}</h1>
        <p className="mt-6 text-stone-600">This certifies that</p>
        <div className="mt-2 text-4xl font-bold text-stone-900">{certification.holderName}</div>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-stone-600">
          has completed the full A&amp;A Compass certification pathway — ethics agreement,
          identity verification, training, written assessment, practical coaching simulation,
          and supervised practice review — and is certified to coach with the A&amp;A Compass
          6A method.
        </p>

        <div className="mx-auto mt-8 grid max-w-xl gap-x-8 gap-y-2 text-left text-sm sm:grid-cols-2">
          <div>
            <div className="text-stone-500">Credential ID</div>
            <div className="font-mono font-semibold text-stone-900">{certification.credentialId}</div>
          </div>
          <div>
            <div className="text-stone-500">Issued</div>
            <div className="font-semibold text-stone-900">
              {certification.issuedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div>
            <div className="text-stone-500">Valid through (annual renewal)</div>
            <div className="font-semibold text-stone-900">
              {certification.expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div>
            <div className="text-stone-500">Verify at</div>
            <div className="break-all font-medium text-emerald-700">{verifyUrl}</div>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-6 text-left">
          <div className="flex-1">
            <div className="h-10 border-b border-stone-400" />
            <div className="mt-1 text-xs text-stone-500">
              A&amp;A Compass Certification Program — Authorized Signature
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Scan to verify this credential" className="h-24 w-24" />
        </div>

        <p className="mt-8 border-t border-stone-200 pt-4 text-xs leading-relaxed text-stone-500">
          {certification.scope} This certificate is non-transferable, remains the property of the
          A&amp;A Compass certification program, and is valid only while the credential status is
          ACTIVE at the verification URL above. It may be suspended or revoked for violations of
          the coach ethics agreement.
        </p>
      </div>
    </div>
  );
}
