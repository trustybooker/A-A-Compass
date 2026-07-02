export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="prose-reading mx-auto max-w-2xl space-y-4 text-stone-700">
      <h1 className="text-2xl font-bold text-stone-900">Terms of Service</h1>

      <h2 className="text-lg font-semibold text-stone-900">1. The service</h2>
      <p>
        A&amp;A Compass provides coaching software: typed and voice-guided alignment sessions,
        habit tracking, reports, and an optional professional certification pathway. It is offered
        in three plans — Free ($0), Plus ($19/month), and Pro ($99/month) — billed monthly through
        Stripe with no long-term commitment.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">2. Accounts</h2>
      <p>
        You must provide accurate information and keep your credentials secure. You are responsible
        for activity under your account. You may delete your account at any time from Settings →
        Your data.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">3. Subscriptions and cancellation</h2>
      <p>
        Paid plans renew monthly until canceled. Cancel anytime via the Stripe customer portal;
        access continues to the end of the paid period, after which the account returns to the Free
        plan. Fees already paid are non-refundable except where required by law.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">4. No guaranteed outcomes</h2>
      <p>
        The service provides reflection and planning tools. We make no guarantee of income, wealth,
        health, healing, relationships, or any other outcome, on any plan. Coaching output is
        informational and you alone decide what actions to take.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">5. Not professional advice</h2>
      <p>
        The service is not therapy, medical care, or financial, legal, or tax advice, and no
        client-professional relationship is created by using it. See the{" "}
        <a href="/legal/disclaimer" className="text-amber-700 underline">
          Disclaimer
        </a>
        .
      </p>

      <h2 className="text-lg font-semibold text-stone-900">6. Certification</h2>
      <p>
        The certification pathway is available to Pro subscribers by application only. Issuance is
        at our discretion after all requirements are met. Credentials are non-transferable, expire
        annually unless renewed, and may be suspended or revoked for violations of the ethics
        agreement. Revoked credentials must no longer be presented.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">7. Acceptable use</h2>
      <p>
        Do not use the service to harm, harass, defraud, or manipulate others; to misrepresent
        credentials; or to violate law. We may suspend accounts that do.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">8. Changes</h2>
      <p>
        We may update these terms; material changes will be announced in the app. Continued use
        after changes means acceptance.
      </p>
    </article>
  );
}
