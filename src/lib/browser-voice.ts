"use client";

// Browser-native voice utilities (Web Speech API) — the FREE voice tier.
// Graceful failure when unsupported is a launch requirement
// (docs/AA_Compass_v5_Test_Plan.md: "Browser voice gracefully fails when unsupported").

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

export function speechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakText(text: string, onEnd?: () => void): boolean {
  if (!speechSynthesisSupported()) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.lang = "en-US";
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (speechSynthesisSupported()) window.speechSynthesis.cancel();
}

/** One-shot dictation into a callback. Returns false when unsupported. */
export function dictateOnce(onTranscript: (text: string) => void, onDone?: () => void): boolean {
  const Ctor = getSpeechRecognition();
  if (!Ctor) return false;
  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript;
    if (transcript) onTranscript(transcript);
  };
  recognition.onerror = () => onDone?.();
  recognition.onend = () => onDone?.();
  recognition.start();
  return true;
}
