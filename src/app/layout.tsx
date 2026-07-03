import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DESCRIPTION =
  "A voice-first prosperity alignment coach. Turn desire into clarity, clarity into action, action into habit, and habit into a life that increases value for you and others. Not therapy, not financial advice, no guaranteed outcomes.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "A&A Compass — turn desire into clarity, action, and habit",
    template: "%s · A&A Compass",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "A&A Compass",
    title: "A&A Compass — turn desire into clarity, action, and habit",
    description: DESCRIPTION,
    url: APP_URL,
    images: [{ url: "/images/morning-light.webp", width: 1600, height: 1067, alt: "A calm, warmly lit space for morning reflection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "A&A Compass — turn desire into clarity, action, and habit",
    description: DESCRIPTION,
    images: ["/images/morning-light.webp"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
