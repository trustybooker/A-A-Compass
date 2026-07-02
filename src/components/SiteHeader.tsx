import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { TierBadge } from "@/components/TierBadge";
import { signOut } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-stone-900">
          <span aria-hidden className="text-xl">🧭</span>
          <span>A&amp;A Compass</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-amber-700">Dashboard</Link>
              <Link href="/session/new" className="hover:text-amber-700">New session</Link>
              <Link href="/history" className="hover:text-amber-700">History</Link>
              <Link href="/habits" className="hover:text-amber-700">Habits</Link>
              <Link href="/weekly-report" className="hover:text-amber-700">Weekly report</Link>
              <Link href="/session/voice-pro" className="hover:text-amber-700">Voice coach</Link>
              <Link href="/certification" className="hover:text-amber-700">Certification</Link>
              <Link href="/billing" className="hover:text-amber-700">Billing</Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="font-medium text-emerald-700 hover:text-emerald-800">Admin</Link>
              )}
              <span className="flex items-center gap-2">
                <TierBadge tier={user.tier} />
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="text-stone-500 hover:text-stone-800">Sign out</button>
                </form>
              </span>
            </>
          ) : (
            <>
              <Link href="/pricing" className="hover:text-amber-700">Pricing</Link>
              <Link href="/auth/login" className="hover:text-amber-700">Log in</Link>
              <Link
                href="/auth/sign-up"
                className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
              >
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
