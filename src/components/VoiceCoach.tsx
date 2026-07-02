"use client";

// Premium A&A Aligned Voice Coach (Pro only).
// The server verifies the Pro entitlement and mints an ephemeral OpenAI
// Realtime token; this component then opens a WebRTC session directly with
// the realtime API. No API keys ever reach the browser.

import { useEffect, useRef, useState } from "react";

type CoachState = "idle" | "connecting" | "live" | "ended" | "error";

export function VoiceCoach() {
  const [state, setState] = useState<CoachState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const voiceSessionIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      void teardown(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function teardown(save: boolean) {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (save && voiceSessionIdRef.current) {
      const summary = transcriptLines.join("\n").slice(0, 18000);
      await fetch(`/api/voice/session/${voiceSessionIdRef.current}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      }).catch(() => undefined);
    }
  }

  async function start() {
    setState("connecting");
    setError(null);
    setTranscriptLines([]);
    try {
      // 1. Server-side entitlement check + ephemeral token.
      const tokenRes = await fetch("/api/voice/session", { method: "POST" });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error ?? "Could not start the voice session.");
      if (!tokenData.clientSecret) throw new Error("Voice service returned no session token.");
      voiceSessionIdRef.current = tokenData.voiceSessionId;

      // 2. Microphone.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. WebRTC peer connection to the realtime API.
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (event) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
          void audioRef.current.play().catch(() => undefined);
        }
      };
      for (const track of stream.getTracks()) pc.addTrack(track, stream);

      const dataChannel = pc.createDataChannel("oai-events");
      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "response.audio_transcript.done" && message.transcript) {
            setTranscriptLines((lines) => [...lines, `Coach: ${message.transcript}`]);
          }
          if (
            message.type === "conversation.item.input_audio_transcription.completed" &&
            message.transcript
          ) {
            setTranscriptLines((lines) => [...lines, `You: ${message.transcript}`]);
          }
        } catch {
          // non-JSON events are ignored
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(tokenData.model)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        },
      );
      if (!sdpRes.ok) throw new Error("Realtime connection was refused. Please try again.");
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });

      setState("live");
    } catch (err) {
      await teardown(false);
      setError(err instanceof Error ? err.message : "Could not start the session.");
      setState("error");
    }
  }

  async function end() {
    await teardown(true);
    setState("ended");
  }

  return (
    <div className="space-y-4">
      {/* remote audio sink */}
      <audio ref={audioRef} className="hidden" />

      <div className="rounded-2xl border border-emerald-300 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-stone-900">A&amp;A Aligned Voice Coach</h2>
            <p className="text-sm text-stone-600">
              {state === "idle" && "Realtime conversation. The coach listens, asks smart follow-ups, and ends with your full outcome."}
              {state === "connecting" && "Connecting — allow microphone access when asked…"}
              {state === "live" && "Live. Speak naturally; you can interrupt at any time."}
              {state === "ended" && "Session ended and summary saved. Well done showing up."}
              {state === "error" && "The session could not start."}
            </p>
          </div>
          {state === "live" ? (
            <button
              type="button"
              onClick={end}
              className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
            >
              End session
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={state === "connecting"}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {state === "connecting" ? "Connecting…" : state === "ended" ? "New session" : "Start voice session"}
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {transcriptLines.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-stone-900">Session transcript</h3>
          <div className="prose-reading mt-2 max-h-80 overflow-y-auto text-sm text-stone-700">
            {transcriptLines.join("\n\n")}
          </div>
        </div>
      )}

      <p className="text-xs text-stone-400">
        The voice coach never promises outcomes, never replaces therapy or professional advice, and
        never takes an action without your explicit confirmation. If you are in crisis, it will
        pause coaching and point you to real support.
      </p>
    </div>
  );
}
