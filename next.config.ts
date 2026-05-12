import type { NextConfig } from "next";

/**
 * DocuGob web — Next.js config.
 *
 * Production targets:
 *  - Vercel (default — no custom runtime needed).
 *  - The Content-Security-Policy is defined in middleware.ts because
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

export default nextConfig;
