"use client";

import { useEffect, useState } from "react";
import { speakText, stopSpeaking, speechSynthesisSupported } from "@/lib/browser-voice";
import { BROWSER_VOICE_LABEL } from "@/lib/tiers";

interface SessionItem {
  id: string;
  area: string;
  createdAt: string;
  result: { fullText: string; alignmentMode: string; score: number } | null;
}

export function ListenMode() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSupported(speechSynthesisSupported());
    void (async () => {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions((data.sessions ?? []).filter((s: SessionItem) => s.result));
      }
      setLoaded(true);
    })();
    return () => stopSpeaking();
  }, []);

  function toggle(session: SessionItem) {
    if (playingId === session.id) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }
    if (!session.result) return;
    const ok = speakText(session.result.fullText, () => setPlayingId(null));
    setPlayingId(ok ? session.id : null);
  }

  if (!supported) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-600">
        Read-aloud isn&apos;t supported in this browser. Your saved readings are still available in{" "}
        <a href="/history" className="text-amber-700 hover:underline">
          History
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-400">{BROWSER_VOICE_LABEL}</p>
      {loaded && sessions.length === 0 && (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-600">
          No saved readings yet — run a session first.
        </p>
      )}
      <ul className="space-y-3">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div>
              <div className="font-medium text-stone-900">
                {new Date(session.createdAt).toLocaleDateString()} · {session.area}
              </div>
              {session.result && (
                <div className="text-sm text-stone-500">
                  {session.result.alignmentMode} · {session.result.score}/100
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => toggle(session)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              {playingId === session.id ? "◼ Stop" : "🔊 Listen"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
