"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({
  links,
  signedIn,
  signOutAction,
}: {
  links: NavLink[];
  signedIn: boolean;
  signOutAction?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-stone-300 p-2 text-stone-700"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full z-50 border-b border-stone-200 bg-white shadow-lg">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 font-medium ${
                    pathname === link.href
                      ? "bg-amber-50 text-amber-800"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {signedIn && signOutAction && (
              <li className="border-t border-stone-100 pt-2">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2 text-left font-medium text-stone-500 hover:bg-stone-50"
                  >
                    Sign out
                  </button>
                </form>
              </li>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
