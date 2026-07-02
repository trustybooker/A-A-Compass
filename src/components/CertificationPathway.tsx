"use client";

// Applicant-facing certification pathway. Every gate here is decorative —
// the server enforces order, scoring, and approval.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ETHICS_AGREEMENT_TEXT,
  TRAINING_MODULES,
  type PathwayStep,
} from "@/lib/certification/pathway";

interface ClientQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export function CertificationPathway({
  hasApplication,
  steps,
  trainingModulesCompleted,
  ethicsAgreed,
  identitySubmitted,
  trainingComplete,
  writtenPassed,
  writtenScore,
  practicalSubmitted,
  questions,
}: {
  hasApplication: boolean;
  steps: PathwayStep[];
  trainingModulesCompleted: number;
  ethicsAgreed: boolean;
  identitySubmitted: boolean;
  trainingComplete: boolean;
  writtenPassed: boolean;
  writtenScore: number | null;
  practicalSubmitted: boolean;
  questions: ClientQuestion[];
}) {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function post(url: string, body: unknown): Promise<Record<string, unknown>> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed.");
      router.refresh();
      return data as Record<string, unknown>;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return {};
    } finally {
      setBusy(false);
    }
  }

  if (!hasApplication) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await post("/api/certification/apply", { purposeStatement: purpose });
        }}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-bold text-stone-900">Apply to the certification pathway</h2>
        <p className="text-sm text-stone-600">
          Applying starts a review process — it does not grant a credential. Tell us why you want
          to coach with the A&amp;A Compass method and how you intend to use it in service of
          others.
        </p>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={6}
          minLength={50}
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          placeholder="Your purpose statement (at least a few sentences)…"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`flex items-start gap-3 rounded-xl border p-4 ${
              step.done
                ? "border-emerald-200 bg-emerald-50"
                : step.awaitingReview
                  ? "border-amber-200 bg-amber-50"
                  : "border-stone-200 bg-white"
            }`}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.done ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </span>
            <div>
              <div className="font-semibold text-stone-900">{step.label}</div>
              <div className="text-sm text-stone-600">
                {step.awaitingReview ? "Submitted — awaiting staff review." : step.description}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-emerald-700">{notice}</p>}

      {!ethicsAgreed && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-stone-900">Ethics agreement</h3>
          <pre className="prose-reading mt-3 max-h-64 overflow-y-auto rounded-lg bg-stone-50 p-4 font-sans text-sm text-stone-700">
            {ETHICS_AGREEMENT_TEXT}
          </pre>
          <button
            type="button"
            disabled={busy}
            onClick={() => post("/api/certification/step", { step: "ethics_agree" })}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            I agree to the ethics commitment
          </button>
        </div>
      )}

      {ethicsAgreed && !identitySubmitted && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await post("/api/certification/step", {
              step: "identity_submit",
              fullLegalName: legalName,
              country,
            });
          }}
          className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-bold text-stone-900">Identity verification</h3>
          <p className="text-sm text-stone-600">
            Staff verify identity before assessments. Submit your legal name and country; our team
            will contact you if documents are required.
          </p>
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            required
            minLength={2}
            placeholder="Full legal name"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            minLength={2}
            placeholder="Country of residence"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Submit for verification
          </button>
        </form>
      )}

      {ethicsAgreed && !trainingComplete && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-stone-900">Training modules</h3>
          <ul className="mt-3 space-y-2">
            {TRAINING_MODULES.map((module, index) => {
              const done = index < trainingModulesCompleted;
              const isNext = index === trainingModulesCompleted;
              return (
                <li key={module} className="flex items-center justify-between gap-3 text-sm">
                  <span className={done ? "text-emerald-700" : "text-stone-700"}>
                    {done ? "✓ " : `${index + 1}. `}
                    {module}
                  </span>
                  {isNext && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        post("/api/certification/step", {
                          step: "training_module_complete",
                          moduleIndex: index,
                        })
                      }
                      className="shrink-0 rounded-lg border border-emerald-300 px-3 py-1 font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Mark complete
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {trainingComplete && !writtenPassed && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = await post("/api/certification/step", {
              step: "written_submit",
              answers,
            });
            if (typeof data.scorePercent === "number") {
              setNotice(
                data.passed
                  ? `You passed the written assessment with ${data.scorePercent}%.`
                  : `Score: ${data.scorePercent}%. A pass requires 80% — review the training and try again.`,
              );
            }
          }}
          className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-bold text-stone-900">Written assessment</h3>
          {writtenScore !== null && (
            <p className="text-sm text-amber-700">
              Previous attempt: {writtenScore}%. You can retake the assessment.
            </p>
          )}
          {questions.map((question, qIndex) => (
            <fieldset key={question.id}>
              <legend className="text-sm font-semibold text-stone-800">
                {qIndex + 1}. {question.prompt}
              </legend>
              <div className="mt-2 space-y-1">
                {question.options.map((option, oIndex) => (
                  <label key={option} className="flex items-start gap-2 text-sm text-stone-700">
                    <input
                      type="radio"
                      name={question.id}
                      required
                      checked={answers[question.id] === oIndex}
                      onChange={() => setAnswers((a) => ({ ...a, [question.id]: oIndex }))}
                      className="mt-1"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Submit assessment
          </button>
        </form>
      )}

      {writtenPassed && !practicalSubmitted && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await post("/api/certification/step", { step: "practical_submit", transcript });
          }}
          className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-bold text-stone-900">Practical coaching simulation</h3>
          <p className="text-sm text-stone-600">
            Run a full practice session with a volunteer using the 6A Engine, then paste the
            transcript (or a detailed session record) below. Staff score it against the rubric:
            truthful reflection, no guarantees, autonomy, referral awareness, and a
            service-oriented outcome.
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            required
            minLength={200}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
            placeholder="Paste the full simulation transcript…"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Submit for review
          </button>
        </form>
      )}
    </div>
  );
}
