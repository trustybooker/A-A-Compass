"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DataControls() {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Deletion failed.");
      }
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-stone-900">Export your data</h2>
        <p className="mt-1 text-sm text-stone-600">
          Download everything we store about you — sessions, results, habits, reports,
          certification records — as a single JSON file. Available on every plan.
        </p>
        <a
          href="/api/account/export"
          className="mt-4 inline-block rounded-lg border border-stone-300 px-5 py-2.5 font-medium text-stone-700 hover:bg-stone-50"
        >
          ⬇ Download my data (JSON)
        </a>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-red-700">Delete account</h2>
        <p className="mt-1 text-sm text-stone-600">
          Permanently deletes your account and all personal data, and cancels any active
          subscription immediately. This cannot be undone.
        </p>
        <form onSubmit={deleteAccount} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "DELETE" to confirm'
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={busy || confirmText !== "DELETE"}
            className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete my account"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
