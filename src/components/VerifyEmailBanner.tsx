"use client";

import { useState } from "react";

export function VerifyEmailBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verification/resend", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? data.message : (data.error ?? "Could not send the email."));
    } catch {
      setMessage("Could not send the email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
      <p className="text-amber-900">
        {message ?? "Please verify your email address — it keeps your account recoverable."}
      </p>
      {!message && (
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          className="rounded-lg border border-amber-400 px-3 py-1.5 font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Resend verification email"}
        </button>
      )}
    </div>
  );
}
