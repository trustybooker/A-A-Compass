export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="prose-reading mx-auto max-w-2xl space-y-4 text-stone-700">
      <h1 className="text-2xl font-bold text-stone-900">Privacy Policy</h1>

      <h2 className="text-lg font-semibold text-stone-900">What we collect</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Account data: email, name (optional), and a securely hashed password.</li>
        <li>
          Session content you write or speak: desires, fears, gratitude, readings, habit logs, and
          voice session summaries. On the Free plan, readings are additionally kept in your own
          browser storage.
        </li>
        <li>Billing status from Stripe (we never see or store full card numbers).</li>
        <li>
          Certification records, if you apply: purpose statement, assessment scores, and identity
          details submitted for verification.
        </li>
        <li>An audit log of security-relevant events (logins, entitlement changes, credential events).</li>
      </ul>

      <h2 className="text-lg font-semibold text-stone-900">How we use it</h2>
      <p>
        To run your sessions, keep your history and streaks, generate pattern summaries and weekly
        reports, enforce plan entitlements, operate the certification registry, and meet legal
        obligations. We do not sell personal data, and we do not use your reflections for
        advertising.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">Voice data</h2>
      <p>
        Free/Plus voice features run in your browser using your device&apos;s own speech engine.
        Pro realtime voice sessions are processed by our AI voice provider to hold the
        conversation; we store the session summary, not raw audio.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">Your rights</h2>
      <p>
        Export all of your data or permanently delete your account at any time from Settings → Your
        data. Deletion removes personal data immediately; anonymized audit entries are retained for
        security and the public credential registry keeps only what is needed to show a revoked or
        expired credential truthfully.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">Public credential registry</h2>
      <p>
        If you earn certification, the verification page shows your name, credential ID, status,
        issue and renewal dates. This registry exists to prevent credential fraud.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">Contact</h2>
      <p>Questions about privacy? Contact support through your account.</p>
    </article>
  );
}
