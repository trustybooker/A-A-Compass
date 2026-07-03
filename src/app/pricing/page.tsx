import Link from "next/link";
import { TIERS, BROWSER_VOICE_LABEL } from "@/lib/tiers";
import { getCurrentUser } from "@/lib/current-user";
import { CheckoutButton } from "@/components/CheckoutButton";
import { softwareApplicationJsonLd } from "@/lib/structured-data";

export const metadata = {
  title: "Pricing",
  description:
    "A&A Compass pricing: Free $0 (one daily Compass Reading), Plus $19/month (unlimited sessions, history, exports), Pro $99/month (realtime A&A Aligned Voice Coach, weekly reports, certification pathway eligibility). Monthly only, cancel anytime.",
  alternates: { canonical: "/pricing" },
};
export const dynamic = "force-dynamic";

// Exactly three public tiers at launch: Free $0, Plus $19/mo, Pro $99/mo.
// No annual plans, no lifetime deals, no trials, no extra tiers.
export default async function PricingPage() {
  const user = await getCurrentUser();
  const signedIn = user !== null;

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd()) }}
      />
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-stone-900">Simple, honest pricing</h1>
        <p className="mt-2 text-stone-600">
          Three plans. Monthly only. Cancel anytime — access continues to the end of the paid period.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(["free", "plus", "pro"] as const).map((id) => {
          const tier = TIERS[id];
          const highlight = id === "pro";
          return (
            <div
              key={id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                highlight ? "border-emerald-400 ring-2 ring-emerald-200" : "border-stone-200"
              }`}
            >
              <h2 className="text-lg font-bold text-stone-900">{tier.label}</h2>
              <p className="mt-1 text-3xl font-extrabold text-stone-900">
                ${tier.priceMonthly}
                <span className="text-base font-medium text-stone-500">/month</span>
              </p>
              <p className="mt-1 text-sm text-stone-500">{tier.tagline}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-stone-700">
                {tier.access.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-emerald-600">✓</span>
                    {item}
                  </li>
                ))}
                {tier.locked.map((item) => (
                  <li key={item} className="flex gap-2 text-stone-400">
                    <span aria-hidden>—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {id === "free" ? (
                  <Link
                    href={signedIn ? "/session/new" : "/auth/sign-up"}
                    className="block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-center font-medium text-stone-700 hover:bg-stone-50"
                  >
                    {signedIn ? "Run today's reading" : "Start free"}
                  </Link>
                ) : (
                  <CheckoutButton
                    tier={id}
                    signedIn={signedIn}
                    label={`Upgrade to ${tier.label}`}
                    className={`w-full rounded-lg px-4 py-2.5 font-medium text-white ${
                      highlight ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-auto max-w-3xl space-y-3 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
        <p>
          <strong>About voice:</strong> {BROWSER_VOICE_LABEL}
        </p>
        <p>
          <strong>About certification:</strong> the A&amp;A Compass Certified Alignment Coach
          pathway is available to Pro subscribers only, and it is never automatic. It requires an
          application, ethics agreement, identity verification, training, a written assessment, a
          practical simulation, supervised practice review, and admin approval — with annual
          renewal and revocation rules.
        </p>
        <p>
          <strong>No hidden promises:</strong> no plan guarantees income, healing, manifestation,
          or outcomes. Every plan is designed to produce clarity, action, habit, gratitude, and
          service.
        </p>
      </div>
    </div>
  );
}
