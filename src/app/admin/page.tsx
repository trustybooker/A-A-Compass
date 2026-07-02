import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AdminCertActions } from "@/components/AdminCertActions";
import { liveCredentialStatus } from "@/lib/certification/credential";

export const metadata = { title: "Admin — certification review" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const applications = await prisma.certificationApplication.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true, tier: true } },
      certification: true,
    },
  });

  const auditEntries = await prisma.auditLog.findMany({
    where: { action: { startsWith: "certification." } },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Certification review</h1>
        <p className="mt-1 text-stone-600">
          Human review is required at every gate: identity, practical scoring, supervised review,
          and final approval. Every action lands in the audit log.
        </p>
      </div>

      {applications.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-600">
          No applications yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => {
            const available: string[] = [];
            if (app.status === "SUBMITTED" || app.status === "IN_PROGRESS" || app.status === "UNDER_REVIEW") {
              if (app.identitySubmittedAt && !app.identityVerifiedAt) available.push("verify_identity");
              if (app.practicalTranscript && !app.practicalPassedAt) available.push("score_practical");
              if (app.practicalPassedAt && !app.supervisedReviewPassedAt)
                available.push("pass_supervised_review");
              available.push("approve", "reject");
            }
            if (app.certification) {
              const live = liveCredentialStatus(app.certification.status, app.certification.expiresAt);
              if (live === "active") available.push("suspend", "revoke");
              if (live === "suspended") available.push("reinstate", "revoke");
              if (live === "expired") available.push("renew", "revoke");
            }
            return (
              <li key={app.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-stone-900">
                      {app.user.name ?? app.user.email}{" "}
                      <span className="text-sm font-normal text-stone-500">({app.user.email}, {app.user.tier})</span>
                    </div>
                    <div className="text-sm text-stone-500">
                      Application {app.status.toLowerCase().replaceAll("_", " ")} ·{" "}
                      {app.createdAt.toLocaleDateString()}
                      {app.certification && (
                        <>
                          {" "}· credential{" "}
                          <span className="font-mono">{app.certification.credentialId}</span> (
                          {liveCredentialStatus(app.certification.status, app.certification.expiresAt)})
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-stone-600 sm:grid-cols-3">
                  <div>Ethics: {app.ethicsAgreedAt ? "✓ agreed" : "—"}</div>
                  <div>
                    Identity:{" "}
                    {app.identityVerifiedAt ? "✓ verified" : app.identitySubmittedAt ? "submitted" : "—"}
                  </div>
                  <div>Training: {app.trainingModulesCompleted}/6</div>
                  <div>
                    Written: {app.writtenScore !== null ? `${app.writtenScore}%` : "—"}
                    {app.writtenPassedAt ? " ✓" : ""}
                  </div>
                  <div>
                    Practical:{" "}
                    {app.practicalScore !== null
                      ? `${app.practicalScore}%${app.practicalPassedAt ? " ✓" : ""}`
                      : app.practicalTranscript
                        ? "submitted"
                        : "—"}
                  </div>
                  <div>Supervised: {app.supervisedReviewPassedAt ? "✓ passed" : "—"}</div>
                </dl>
                <details className="mt-2 text-sm text-stone-600">
                  <summary className="cursor-pointer font-medium text-stone-700">
                    Purpose statement{app.practicalTranscript ? " & practical transcript" : ""}
                  </summary>
                  <p className="prose-reading mt-2 rounded-lg bg-stone-50 p-3">{app.purposeStatement}</p>
                  {app.practicalTranscript && (
                    <p className="prose-reading mt-2 max-h-64 overflow-y-auto rounded-lg bg-stone-50 p-3">
                      {app.practicalTranscript}
                    </p>
                  )}
                </details>
                <div className="mt-4">
                  <AdminCertActions applicationId={app.id} available={available} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <h2 className="text-lg font-bold text-stone-900">Recent certification audit trail</h2>
        <ul className="mt-3 space-y-1 text-sm text-stone-600">
          {auditEntries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-stone-100 bg-white px-3 py-2">
              <span className="font-mono text-xs text-stone-400">
                {entry.createdAt.toISOString().replace("T", " ").slice(0, 19)}
              </span>{" "}
              {entry.action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
