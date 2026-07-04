import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { TierBadge } from "@/components/TierBadge";
import { MobileNav, type NavLink } from "@/components/MobileNav";
import { signOut } from "@/lib/auth";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  const links: NavLink[] = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/session/new", label: "New session" },
        { href: "/history", label: "History" },
        { href: "/habits", label: "Habits" },
        { href: "/weekly-report", label: "Weekly report" },
        { href: "/session/voice-pro", label: "Voice coach" },
        { href: "/certification", label: "Certification" },
        { href: "/billing", label: "Billing" },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [
        { href: "/pricing", label: "Pricing" },
        { href: "/auth/login", label: "Log in" },
        { href: "/auth/sign-up", label: "Start free" },
      ];

  return (
    <header className="relative border-b border-stone-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-stone-900">
          <span aria-hidden className="text-xl">🧭</span>
          <span>A&amp;A Compass</span>
          {user && <TierBadge tier={user.tier} />}
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-x-4 text-sm md:flex">
          {user ? (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.href === "/admin"
                      ? "font-medium text-emerald-700 hover:text-emerald-800"
                      : "hover:text-amber-700"
                  }
                >
                  {link.label}
                </Link>
              ))}
              <form action={signOutAction}>
                <button type="submit" className="text-stone-500 hover:text-stone-800">
                  Sign out
                </button>
              </form>
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

        {/* Mobile navigation */}
        <MobileNav links={links} signedIn={user !== null} signOutAction={signOutAction} />
      </div>
    </header>
  );
}
