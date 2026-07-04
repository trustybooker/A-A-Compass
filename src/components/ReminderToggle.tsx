"use client";

import { useState } from "react";

export function ReminderToggle({ initialOptIn }: { initialOptIn: boolean }) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const next = !optIn;
    try {
      const res = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderOptIn: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not update preferences.");
      }
      setOptIn(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div>
        <div className="font-medium text-stone-900">Daily habit reminder</div>
        <div className="text-sm text-stone-500">
          One email a day, only if a habit is still unlogged. No streak-shaming — just a nudge.
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={optIn}
        disabled={busy}
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          optIn ? "bg-emerald-600" : "bg-stone-300"
        } disabled:opacity-60`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            optIn ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
