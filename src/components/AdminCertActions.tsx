"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCertActions({
  applicationId,
  available,
}: {
  applicationId: string;
  available: string[]; // action ids the server considers possible right now
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function act(action: string) {
    let body: Record<string, unknown> = { action };
    if (action === "score_practical") {
      const raw = window.prompt("Practical simulation score (0-100, pass ≥ 80):");
      if (raw === null) return;
      const score = Number(raw);
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        setError("Score must be an integer 0-100.");
        return;
      }
      body = { action, score };
    }
    if (action === "reject" || action === "revoke" || action === "suspend") {
      const reason = window.prompt(`Reason for ${action}:`);
      if (!reason) return;
      body = action === "reject" ? { action, notes: reason } : { action, reason };
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/certification/${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Action failed.");
      if (data.credentialId) setNotice(`Credential issued: ${data.credentialId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const LABELS: Record<string, string> = {
    verify_identity: "Verify identity",
    score_practical: "Score practical",
    pass_supervised_review: "Pass supervised review",
    approve: "Approve & issue credential",
    reject: "Reject",
    revoke: "Revoke credential",
    suspend: "Suspend credential",
    reinstate: "Reinstate credential",
    renew: "Renew credential",
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <button
            key={action}
            type="button"
            disabled={busy}
            onClick={() => act(action)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
              action === "approve"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : action === "reject" || action === "revoke"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-stone-300 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {LABELS[action] ?? action}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}
    </div>
  );
}
