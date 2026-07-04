"use client";

// A short scripted preview of how a Pro voice session flows, played with the
// user's BROWSER voice and labeled as such — we never fake the premium voice.
// Shown only to users who don't have Pro voice access yet.

import { useEffect, useState } from "react";
import { speakText, stopSpeaking, speechSynthesisSupported } from "@/lib/browser-voice";

const SAMPLE_LINES: Array<[speaker: "Coach" | "You", line: string]> = [
  ["Coach", "What do you want more of right now — not the polished version, the honest one?"],
  ["You", "Honestly? Steady income without the constant anxiety."],
  ["Coach", "So under the money is calm — the ability to create without panic. What usually stops you a step before acting?"],
  ["You", "I wait until I'm sure it'll work."],
  [
    "Coach",
    "Then today we trade certainty for evidence: one small money decision, finished before dinner. I'll check in with you tomorrow — and we'll build the habit loop that makes this automatic.",
  ],
];

export function VoiceSample() {
  const [supported, setSupported] = useState(true);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    setSupported(speechSynthesisSupported());
    return () => stopSpeaking();
  }, []);

  function playAll() {
    if (playingIndex !== null) {
      stopSpeaking();
      setPlayingIndex(null);
      return;
    }
    let index = 0;
    const playNext = () => {
      if (index >= SAMPLE_LINES.length) {
        setPlayingIndex(null);
        return;
      }
      setPlayingIndex(index);
      const [, line] = SAMPLE_LINES[index];
      index += 1;
      if (!speakText(line, playNext)) setPlayingIndex(null);
    };
    playNext();
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-stone-900">What a session sounds like</h2>
      <div className="mt-3 space-y-2">
        {SAMPLE_LINES.map(([speaker, line], i) => (
          <p
            key={i}
            className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
              speaker === "Coach"
                ? "bg-emerald-50 text-stone-800"
                : "ml-6 bg-stone-50 text-stone-600"
            } ${playingIndex === i ? "ring-2 ring-emerald-400" : ""}`}
          >
            <span className="font-semibold">{speaker}:</span> {line}
          </p>
        ))}
      </div>
      {supported && (
        <button
          type="button"
          onClick={playAll}
          className="mt-4 rounded-lg border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          {playingIndex !== null ? "◼ Stop" : "▶ Hear this sample (browser voice)"}
        </button>
      )}
      <p className="mt-3 text-xs text-stone-400">
        This preview is scripted and read by your browser&apos;s own voice. The Pro coach is a
        realtime AI conversation with a higher-quality voice, interruptions, smart follow-up
        questions, and memory of your pattern — and like everything here, it never promises
        outcomes.
      </p>
    </div>
  );
}
