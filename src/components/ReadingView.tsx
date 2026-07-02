"use client";

import { useEffect, useState } from "react";
import { speakText, stopSpeaking, speechSynthesisSupported } from "@/lib/browser-voice";
import { BROWSER_VOICE_LABEL } from "@/lib/tiers";

export function ReadingView({
  text,
  sessionId,
  canExport,
}: {
  text: string;
  sessionId?: string;
  canExport: boolean;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTtsSupported(speechSynthesisSupported());
    return () => stopSpeaking();
  }, []);

  function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      const ok = speakText(text, () => setSpeaking(false));
      setSpeaking(ok);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {ttsSupported ? (
          <button
            type="button"
            onClick={toggleSpeak}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            {speaking ? "◼ Stop" : "🔊 Read aloud (browser voice)"}
          </button>
        ) : (
          <span className="text-sm text-stone-500">
            Read-aloud is not supported in this browser — the reading below is fully yours to keep.
          </span>
        )}
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        {canExport && sessionId && (
          <a
            href={`/api/sessions/${sessionId}/export`}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ⬇ Export .txt
          </a>
        )}
        {canExport && sessionId && (
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            🖨 Print / PDF
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-stone-400">{BROWSER_VOICE_LABEL}</p>
      <div className="prose-reading mt-4 text-stone-800">{text}</div>
    </div>
  );
}
