"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "sign-up" | "login" }) {
  const router = useRouter();
  const search = useSearchParams();
  const plan = search.get("plan");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "sign-up") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Sign-up failed.");
        }
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Invalid email or password.");
      router.push(plan === "plus" || plan === "pro" ? "/pricing" : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-stone-900">
        {mode === "sign-up" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {mode === "sign-up"
          ? "Start with one free Compass Reading per day."
          : "Log in to continue your alignment practice."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "sign-up" && (
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Name (optional)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              autoComplete="name"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? "One moment…" : mode === "sign-up" ? "Create account" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-500">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-amber-700 hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/auth/sign-up" className="font-medium text-amber-700 hover:underline">
              Create a free account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
