import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "A&A Compass — turn desire into clarity, action, and habit",
    template: "%s · A&A Compass",
  },
  description:
    "A voice-first prosperity alignment coach. Turn desire into clarity, clarity into action, action into habit, and habit into a life that increases value for you and others. Not therapy, not financial advice, no guaranteed outcomes.",
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
