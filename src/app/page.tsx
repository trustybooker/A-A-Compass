import Image from "next/image";
import Link from "next/link";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  faqJsonLd,
} from "@/lib/structured-data";

const SIX_A = [
  ["Awareness", "Reflect what is true right now — no judgment, no story."],
  ["Alignment", "Identify the fear, contradiction, or misalignment to release."],
  ["Aim", "Form a definite vision that guides the next season."],
  ["Action", "Choose one grounded action you can complete today."],
  ["Accumulation", "Create one habit loop so progress compounds."],
  ["Abundance", "Connect the desire to service and value for others."],
] as const;

export default function LandingPage() {
  return (
    <div className="space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), softwareApplicationJsonLd(), faqJsonLd()]),
        }}
      />
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 md:text-5xl">
            Turn desire into clarity.
            <br />
            Clarity into action.
            <br />
            <span className="text-amber-700">Action into a life that increases value.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-stone-600">
            A&amp;A Compass is a voice-first prosperity alignment coach. Every session ends with a
            truth reflection, a definite vision, one grounded action, one habit loop, one gratitude
            anchor, and one way to increase life for someone else.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700"
            >
              Run your first free reading
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-stone-300 px-6 py-3 font-semibold text-stone-700 hover:bg-white"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            Free forever tier. No credit card required. No guaranteed-outcome promises — ever.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <Image
            src="/images/morning-light.webp"
            alt="A calm, warmly lit space for morning reflection"
            width={1600}
            height={1067}
            priority
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-stone-900">The 6A Engine</h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          One practical system: thought creates direction, imagination gives form, faith creates
          calm certainty, action expresses inner decision, habit shapes destiny, and gratitude and
          service turn prosperity into increase.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIX_A.map(([title, body], i) => (
            <div key={title} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-amber-700">Step {i + 1}</div>
              <h3 className="mt-1 font-bold text-stone-900">{title}</h3>
              <p className="mt-1 text-sm text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="order-2 overflow-hidden rounded-2xl shadow-lg md:order-1">
          <Image
            src="/images/desk-journal.webp"
            alt="A quiet desk with a journal, ready for a Compass session"
            width={1600}
            height={1067}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-2xl font-bold text-stone-900">Every session ends with an outcome</h2>
          <ul className="mt-4 space-y-2 text-stone-700">
            {[
              "A truth reflection of where you actually are",
              "The deeper value under your desire",
              "One misalignment or pattern to release",
              "A definite vision",
              "One grounded action for today",
              "One habit loop that compounds",
              "One gratitude anchor",
              "One service action that increases life for others",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-amber-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-8">
        <h2 className="text-2xl font-bold text-stone-900">Honest by design</h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          A&amp;A Compass is a coaching tool. It is <strong>not</strong> therapy, not financial,
          medical, or legal advice, not a guaranteed manifestation system, and not an income
          promise. It will never blame you for hardship or make you dependent on it. Your results
          come from your actions and circumstances — the compass keeps them aligned.
        </p>
        <div className="mt-4">
          <Link href="/legal/disclaimer" className="font-medium text-amber-700 hover:underline">
            Read the full disclaimer →
          </Link>
        </div>
      </section>
    </div>
  );
}
