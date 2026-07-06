"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AREAS, STATES, ADVANCED_MODES, type CompassReading } from "@/lib/compass/engine";
import type { TierId } from "@/lib/tiers";
import { BROWSER_VOICE_LABEL } from "@/lib/tiers";
import { dictateOnce, speechRecognitionSupported } from "@/lib/browser-voice";
import { ReadingCard } from "@/components/ReadingCard";

interface ReadingResponse {
  kind: "reading" | "safety" | "limit";
  sessionId?: string;
  reading?: CompassReading;
  message?: string;
  error?: string;
  concern?: string;
}

export function NewSessionForm({ tier }: { tier: TierId }) {
  const [area, setArea] = useState<(typeof AREAS)[number]>("Money");
  const [state, setState] = useState<(typeof STATES)[number]>("Hopeful");
  const [coachingMode, setCoachingMode] = useState<string>("");
  const [desire, setDesire] = useState("");
  const [fear, setFear] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [listening, setListening] = useState<string | null>(null);
  const [sttSupported, setSttSupported] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReadingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noticeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setSttSupported(speechRecognitionSupported()), []);

  // The outcome must never sit unseen below the fold. ReadingCard scrolls
  // itself; limit/safety notices scroll here.
  useEffect(() => {
    if (result && result.kind !== "reading") {
      noticeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const canUseModes = tier === "pro";

  function dictate(field: "desire" | "fear" | "gratitude", setter: (v: string) => void) {
    const started = dictateOnce(
      (text) => setter(text),
      () => setListening(null),
    );
    if (!started) {
      setSttSupported(false);
      return;
    }
    setListening(field);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          state,
          desire,
          fear,
          gratitude,
          coachingMode: canUseModes && coachingMode ? coachingMode : undefined,
        }),
      });
      const data: ReadingResponse = await res.json();
      if (res.status === 429) {
        setResult(data);
      } else if (!res.ok) {
        throw new Error(data.error ?? "Could not create the session.");
      } else {
        setResult(data);
        if (data.kind === "reading" && data.reading && tier === "free") {
          // Free tier: local-only history (MVP) — cloud history is Plus/Pro.
          try {
            const history = JSON.parse(localStorage.getItem("aa_local_history") ?? "[]");
            history.unshift({ date: new Date().toISOString(), text: data.reading.fullText });
            localStorage.setItem("aa_local_history", JSON.stringify(history.slice(0, 20)));
          } catch {
            // localStorage unavailable — the reading still displays
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const voiceButton = (field: "desire" | "fear" | "gratitude", setter: (v: string) => void) =>
    sttSupported ? (
      <button
        type="button"
        onClick={() => dictate(field, setter)}
        className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
      >
        {listening === field ? "🎙 Listening…" : "🎙 Speak"}
      </button>
    ) : null;

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Every reading now ends with one visible achievement, one discernment rule, one proof signal, and one service step.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Area of life</span>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as (typeof AREAS)[number])}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Current state</span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value as (typeof STATES)[number])}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>

        {canUseModes ? (
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Guided mode (Pro)</span>
            <select
              value={coachingMode}
              onChange={(e) => setCoachingMode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              <option value="">Standard session</option>
              {ADVANCED_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-xs text-stone-400">
            Advanced guided modes (Money, Fear Release, Night Review…) are part of Pro.{" "}
            <Link href="/pricing" className="text-amber-700 hover:underline">
              See plans
            </Link>
          </p>
        )}

        <label className="block">
          <span className="flex items-center justify-between text-sm font-medium text-stone-700">
            What do you want to achieve in the next 24 hours? {voiceButton("desire", setDesire)}
          </span>
          <textarea
            value={desire}
            onChange={(e) => setDesire(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            placeholder="Describe the desire or visible result in your own words…"
          />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm font-medium text-stone-700">
            What fear, impulse, or pattern keeps getting in the way? {voiceButton("fear", setFear)}
          </span>
          <textarea
            value={fear}
            onChange={(e) => setFear(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm font-medium text-stone-700">
            What are you grateful for today? {voiceButton("gratitude", setGratitude)}
          </span>
          <textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>

        {!sttSupported && (
          <p className="text-xs text-stone-400">
            Speech input isn&apos;t supported in this browser — typing works just as well.
          </p>
        )}
        <p className="text-xs text-stone-400">{BROWSER_VOICE_LABEL}</p>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber-600 px-6 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? "Aligning…" : "Generate my achievement reading"}
        </button>
      </form>

      {result?.kind === "limit" && (
        <div ref={noticeRef} className="scroll-mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6">
          <h2 className="font-bold text-amber-900">Today&apos;s free reading is complete</h2>
          <p className="mt-1 text-amber-800">{result.error}</p>
          <Link
            href="/pricing"
            className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
          >
            See Plus &amp; Pro
          </Link>
        </div>
      )}

      {result?.kind === "safety" && result.message && (
        <div ref={noticeRef} className="scroll-mt-6 rounded-2xl border border-sky-300 bg-sky-50 p-6">
          <h2 className="font-bold text-sky-900">A note before anything else</h2>
          <div className="prose-reading mt-2 text-sky-900">{result.message}</div>
        </div>
      )}

      {result?.kind === "reading" && result.reading && (
        <div>
          {tier === "free" && (
            <p className="mb-2 text-sm text-stone-500">
              Saved to this device only. Upgrade to Plus for cloud history, streaks, and exports.
            </p>
          )}
          <ReadingCard reading={result.reading} sessionId={result.sessionId} tier={tier} />
        </div>
      )}
    </div>
  );
}
