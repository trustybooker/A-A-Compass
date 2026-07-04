import type { NextConfig } from "next";

// Production security headers. The microphone permission is granted to self
// only — the browser voice utility and the Pro realtime voice coach both
// capture audio from our own origin.
//
// CSP notes:
// - 'unsafe-inline' script/style is required by Next.js hydration and
//   Tailwind; external script origins are still fully blocked.
// - connect-src allows api.openai.com for the Pro voice coach's WebRTC SDP
//   exchange (the ephemeral token flow); everything else stays same-origin.
// - img-src data:/blob: covers QR-code data URLs and media previews.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.openai.com",
  "media-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
