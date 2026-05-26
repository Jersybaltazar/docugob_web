import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * DocuGob web — Next.js config.
 *
 * Production targets:
 *  - Vercel (default — no custom runtime needed).
 *  - The Content-Security-Policy is defined in proxy.ts because
 *    nonces need per-request values; the headers below are the static
 *    ones that Vercel can serve from its edge.
 */
const nextConfig: NextConfig = {
  // Strict mode catches subtle bugs (double-mounted effects, etc.).
  reactStrictMode: true,

  // We don't host user-supplied images yet, so disable remote patterns
  // entirely. Re-add when Sprint 7 lands tenant logos.
  images: {
    remotePatterns: [],
  },

  // Allow the Vercel build to succeed even if the API is unreachable
  // during static generation — the app is client-rendered for any page
  // that needs auth.
  experimental: {
    // Empty for now; placeholder so future flags have a home.
  },

  // Production headers complementing vercel.json. We list both so it
  // works whether you deploy on Vercel or via `next start` somewhere
  // else (Railway, your own box, etc.).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry only in production builds. The wrapper reprocesses
// the module graph on every HMR to inject tracing/source-map metadata,
// which is wasted work in dev — and it noticeably slows down save →
// reload cycles in Turbopack. The runtime SDK still initializes in
// dev via `instrumentation.ts` / `instrumentation-client.ts` so you
// can still test error capture locally.
const isSentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
const isProductionBuild = process.env.NODE_ENV === "production";

export default isSentryEnabled && isProductionBuild
  ? withSentryConfig(nextConfig, {
      // Source maps upload — only happens when SENTRY_AUTH_TOKEN is
      // set in the build environment (CI / Vercel). Without it, the
      // wrapper still injects the SDK but skips the upload step.
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      // Don't try to widen Vercel's response with a `/monitoring`
      // tunnel route — keeps the proxy.ts behavior intact.
      tunnelRoute: undefined,
      disableLogger: true,
    })
  : nextConfig;
