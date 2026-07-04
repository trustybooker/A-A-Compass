"use client";

// The Compass Reading as a designed artifact: score dial, sectioned 6A
// outcome, a dominant "one action today" card, and next steps that turn the
// reading into behavior (add the habit loop, return tomorrow).
// All gating here is UX only — the server decides what tiers can do.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { speakText, stopSpeaking, speechSynthesisSupported } from "@/lib/browser-voice";
import { BROWSER_VOICE_LABEL, hasFeature, type TierId } from "@/lib/tiers";

export interface ReadingCardData {
  score: number;
  alignmentMode: string;
  area: string;
  state: string;
  coachingMode?: string | null;
  truthReflection: string;
  deeperValue: string;
  misalignmentToRelease: string;
  definiteVision: string;
  alignedAction: string;
  habitLoop: string;
  gratitudeAnchor: string;
  serviceAction: string;
  plan24Hour?: string | null;
  plan7Day?: string | null;
  plan30Day?: string | null;
  fullText: string;
}

function ScoreDial({ score }: { score: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Alignment score ${score} out of 100`}>
      <circle cx="38" cy="38" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="7" />
      <circle
        cx="38"
        cy="38"
        r={radius}
        fill="none"
        stroke="#d97706"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="36" textAnchor="middle" className="fill-stone-900" fontSize="19" fontWeight="800">
        {score}
      </text>
      <text x="38" y="52" textAnchor="middle" className="fill-stone-400" fontSize="10">
        /100
      </text>
    </svg>
  );
}

function Section({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "default" | "vision";
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === "vision" ? "border-stone-200 bg-stone-50" : "border-stone-100 bg-white"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</div>
      <div className={`mt-1 text-[15px] leading-relaxed text-stone-800 ${tone === "vision" ? "italic" : ""}`}>
        {children}
      </div>
    </div>
  );
}

export function ReadingCard({
  reading,
  sessionId,
  tier,
}: {
  reading: ReadingCardData;
  sessionId?: string;
  tier: TierId;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [copied, setCopied] = useState(false);
  const [habitState, setHabitState] = useState<"idle" | "busy" | "added" | "error">("idle");

  const canExport = hasFeature(tier, "exports");
  const canTrackHabits = hasFeature(tier, "habit_tracking");
  const isFree = tier === "free";

  useEffect(() => {
    setTtsSupported(speechSynthesisSupported());
    // Bring the artifact into view the moment it exists — the result must
    // never sit unseen below the fold.
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return () => stopSpeaking();
  }, []);

  function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(speakText(reading.fullText, () => setSpeaking(false)));
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(reading.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function addHabit() {
    setHabitState("busy");
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Daily alignment loop — ${reading.area}` }),
      });
      setHabitState(res.ok ? "added" : "error");
    } catch {
      setHabitState("error");
    }
  }

  const toolbarButton =
    "rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50";

  return (
    <div ref={containerRef} className="scroll-mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      {/* Header: score + mode */}
      <div className="flex flex-wrap items-center gap-5">
        <ScoreDial score={reading.score} />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Your A&amp;A Compass Reading
          </div>
          <h2 className="text-xl font-extrabold text-stone-900">{reading.alignmentMode}</h2>
          <p className="text-sm text-stone-500">
            {reading.area} · feeling {reading.state.toLowerCase()}
            {reading.coachingMode ? ` · ${reading.coachingMode} mode` : ""}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
        {ttsSupported && (
          <button type="button" onClick={toggleSpeak} className={toolbarButton}>
            {speaking ? "◼ Stop" : "🔊 Listen (browser voice)"}
          </button>
        )}
        <button type="button" onClick={copy} className={toolbarButton}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
        {canExport && sessionId && (
          <a href={`/api/sessions/${sessionId}/export`} className={toolbarButton}>
            ⬇ Export
          </a>
        )}
        <button type="button" onClick={() => window.print()} className={toolbarButton}>
          🖨 Print
        </button>
      </div>
      {ttsSupported && <p className="mt-1.5 text-xs text-stone-400">{BROWSER_VOICE_LABEL}</p>}

      {/* The 6A outcome */}
      <div className="mt-5 space-y-3">
        <Section label="Truth reflection">{reading.truthReflection}</Section>
        <Section label="Deeper value">{reading.deeperValue}</Section>
        <Section label="Misalignment to release">{reading.misalignmentToRelease}</Section>
        <Section label="Definite vision" tone="vision">
          “{reading.definiteVision}”
        </Section>

        {/* The one thing that matters most today — visually dominant */}
        <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
            ⭑ Your one aligned action today
          </div>
          <p className="mt-1.5 text-[17px] font-semibold leading-relaxed text-stone-900">
            {reading.alignedAction}
          </p>
        </div>

        <Section label="One habit loop">{reading.habitLoop}</Section>
        <Section label="Gratitude anchor">{reading.gratitudeAnchor}</Section>
        <Section label="Service / increase-life action">{reading.serviceAction}</Section>

        {(reading.plan24Hour || reading.plan7Day || reading.plan30Day) && (
          <details className="rounded-xl border border-stone-100 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-stone-700">
              Your plans{reading.plan30Day ? " (24-hour · 7-day · 30-day)" : reading.plan7Day ? " (24-hour · 7-day)" : ""}
            </summary>
            <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-stone-800">
              {reading.plan24Hour && <p className="whitespace-pre-line">{reading.plan24Hour}</p>}
              {reading.plan7Day && <p className="whitespace-pre-line">{reading.plan7Day}</p>}
              {reading.plan30Day && <p className="whitespace-pre-line">{reading.plan30Day}</p>}
            </div>
          </details>
        )}
      </div>

      {/* Next steps — the reading must never be a dead end */}
      <div className="mt-6 border-t border-stone-100 pt-5 print:hidden">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-400">Next steps</div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {canTrackHabits ? (
            habitState === "added" ? (
              <Link
                href="/habits"
                className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800"
              >
                ✓ Habit added — track it
              </Link>
            ) : (
              <button
                type="button"
                onClick={addHabit}
                disabled={habitState === "busy"}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {habitState === "busy" ? "Adding…" : "＋ Add this habit loop to my tracker"}
              </button>
            )
          ) : (
            <Link
              href="/pricing"
              className="rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
            >
              🔒 Track this habit loop with Plus
            </Link>
          )}
          {isFree ? (
            <span className="text-sm text-stone-500">
              Do the action, log what changed — your next free reading unlocks tomorrow.
            </span>
          ) : (
            <Link href="/session/new" className="text-sm font-medium text-amber-700 hover:underline">
              Run another session →
            </Link>
          )}
        </div>
        {habitState === "error" && (
          <p className="mt-2 text-sm text-red-600">Could not add the habit — please try again.</p>
        )}
      </div>
    </div>
  );
}
