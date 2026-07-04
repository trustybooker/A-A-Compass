import Link from "next/link";
import { GLOBAL_DISCLAIMER } from "@/lib/safety";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white print:hidden">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-sm text-stone-500">
        <p className="max-w-3xl">{GLOBAL_DISCLAIMER}</p>
        <p>
          If you are in crisis, call your local emergency number. In the US, call or text{" "}
          <span className="font-semibold">988</span> (Suicide &amp; Crisis Lifeline).
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/legal/terms" className="hover:text-stone-800">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-stone-800">Privacy</Link>
          <Link href="/legal/disclaimer" className="hover:text-stone-800">Disclaimer</Link>
          <Link href="/pricing" className="hover:text-stone-800">Pricing</Link>
        </nav>
        <p>© {new Date().getFullYear()} A&amp;A Compass. All rights reserved.</p>
      </div>
    </footer>
  );
}
