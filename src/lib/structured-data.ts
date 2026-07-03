// JSON-LD structured data (schema.org) for search and answer engines.
// Claims here must stay as truthful as the app itself: it is a coaching
// software product with exactly three public offers — never therapy, never
// guaranteed outcomes.

import { TIERS } from "@/lib/tiers";

const base = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "A&A Compass",
    url: base(),
    logo: `${base()}/images/morning-light.webp`,
    description:
      "A&A Compass is a voice-first prosperity alignment coaching app. It helps people turn desire into clarity, action, habit, gratitude, and service. It is not therapy, medical, legal, or financial advice, and it never guarantees outcomes.",
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "A&A Compass",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    url: base(),
    description:
      "A coaching app built on the 6A Engine: Awareness, Alignment, Aim, Action, Accumulation, Abundance. Every session produces a truth reflection, a definite vision, one grounded action, one habit loop, one gratitude anchor, and one service action.",
    offers: (["free", "plus", "pro"] as const).map((id) => ({
      "@type": "Offer",
      name: `A&A Compass ${TIERS[id].label}`,
      price: TIERS[id].priceMonthly.toFixed(2),
      priceCurrency: "USD",
      description: TIERS[id].tagline,
      ...(TIERS[id].priceMonthly > 0
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: TIERS[id].priceMonthly.toFixed(2),
              priceCurrency: "USD",
              billingIncrement: 1,
              unitText: "MONTH",
            },
          }
        : {}),
    })),
  };
}

/** FAQ content for answer engines — kept strictly aligned with the disclaimer. */
export function faqJsonLd() {
  const qa: Array<[string, string]> = [
    [
      "What is A&A Compass?",
      "A&A Compass is a voice-first prosperity alignment coaching app. Each session runs the 6A Engine (Awareness, Alignment, Aim, Action, Accumulation, Abundance) and ends with a truth reflection, a definite vision, one grounded action, one habit loop, one gratitude anchor, and one service action.",
    ],
    [
      "Is A&A Compass therapy or professional advice?",
      "No. A&A Compass is a coaching tool. It is not therapy, medical care, or financial, legal, or tax advice, and it refers users to licensed professionals and crisis resources when a request is outside coaching scope.",
    ],
    [
      "Does A&A Compass guarantee results or income?",
      "No. No plan guarantees income, healing, manifestation, or any outcome. Results depend on each person's actions and circumstances; the app provides clarity, planning, and habit support.",
    ],
    [
      "How much does A&A Compass cost?",
      "There are exactly three plans: Free ($0, one typed Compass Reading per day with browser-based voice), Plus ($19/month, unlimited sessions, saved history, streaks, exports, and plans), and Pro ($99/month, the realtime A&A Aligned Voice Coach, pattern memory, weekly coach reports, and certification pathway eligibility).",
    ],
    [
      "How does A&A Compass certification work?",
      "Certification is available to Pro subscribers by application only and is never automatic. It requires an ethics agreement, identity verification, training, a written assessment, a scored practical simulation, supervised practice review, and staff approval. Credentials carry an ID and QR code that anyone can verify on a public page showing live active, suspended, revoked, or expired status.",
    ],
  ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
