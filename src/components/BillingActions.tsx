"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not open the billing portal.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the billing portal.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPortal}
        disabled={busy}
        className="rounded-lg border border-stone-300 px-5 py-2.5 font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
      >
        {busy ? "Opening…" : "Manage subscription (Stripe portal)"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
