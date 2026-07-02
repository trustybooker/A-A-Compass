export const metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <article className="prose-reading mx-auto max-w-2xl space-y-4 text-stone-700">
      <h1 className="text-2xl font-bold text-stone-900">Disclaimer</h1>

      <h2 className="text-lg font-semibold text-stone-900">What A&amp;A Compass is</h2>
      <p>
        A&amp;A Compass is a coaching tool for personal clarity, aligned action, habit formation,
        gratitude, and service. Every session produces a reflection and a practical plan you choose
        to act on — or not. You remain fully in charge of your decisions.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">What A&amp;A Compass is not</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>
          <strong>Not therapy or medical care.</strong> It does not diagnose, treat, or cure any
          condition. If you are struggling with your mental or physical health, please see a
          licensed professional. In crisis, call your local emergency number (US: call or text 988).
        </li>
        <li>
          <strong>Not financial, legal, or tax advice.</strong> It will never tell you what to
          invest in, sign, or file. Consult licensed professionals for those decisions.
        </li>
        <li>
          <strong>Not a guaranteed manifestation system or income promise.</strong> No plan, price
          tier, session, or certification guarantees money, healing, or any outcome. Results depend
          on your actions and circumstances.
        </li>
        <li>
          <strong>Not a spiritual authority or dependency system.</strong> The coach is designed to
          strengthen your own judgment, not replace it, and never uses coercive religious framing.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-stone-900">About certification</h2>
      <p>
        The A&amp;A Compass Certified Alignment Coach credential is a proprietary coaching-method
        certification. It is not a therapy license, financial advisor license, medical credential,
        legal credential, or ICF credential, and certified coaches are prohibited from presenting
        it as one. Credentials can be verified at any time via their public verification page and
        can be suspended or revoked for ethics violations.
      </p>

      <h2 className="text-lg font-semibold text-stone-900">About the voice features</h2>
      <p>
        Free voice uses your browser/device voice features; quality and availability vary by
        device. The premium A&amp;A Aligned Voice Coach (Pro) is an AI voice agent bound by the
        same rules as everything above: no guarantees, no professional advice, no dependency.
      </p>
    </article>
  );
}
