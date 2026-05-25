/**
 * DocuGob — Next.js proxy (Next 16's renamed `middleware`).
 *
 * Two concerns share this file because the runtime envelope is the
 * same:
 *   1. Auth gating — `/dashboard/*` requires the access cookie; auth
 *      pages bounce signed-in users to the dashboard.
 *   2. Content-Security-Policy (Sprint D) — generate a per-request
 *      nonce, forward it via `x-nonce` so Server Components can apply
 *      it to inline `<Script>` tags, and attach the CSP header to the
 *      response. CSP only applies in production to keep the dev
 *      experience (hot reload, eval) working as expected.
 *
 * AUDIT §10 — the nonce + `strict-dynamic` combination prevents the
 * common XSS vector where an attacker injects an inline script: only
 * scripts carrying the request's nonce execute.
 *
 * Note: Next 16 renamed `middleware.ts` → `proxy.ts` and the export
 * `middleware()` → `proxy()`. The API and `config` matcher are
 * identical. See https://nextjs.org/docs/messages/middleware-to-proxy
 */

import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/server/auth-cookies";

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

const isProduction = process.env.NODE_ENV === "production";

/**
 * Domains the app currently needs to load resources from. Add new
 * origins here as integrations land — narrower is better.
 *
 *   - Culqi:    https://checkout.culqi.com / https://secure.culqi.com
 *               (pricing checkout dialog loads Culqi.js)
 *   - Self ('self') covers Next.js' own static assets and the API
 *               routes under /api/*.
 */
const CSP_SCRIPT_EXTRA = "https://checkout.culqi.com https://secure.culqi.com";
const CSP_CONNECT_EXTRA =
  "https://checkout.culqi.com https://secure.culqi.com https://api.culqi.com";
const CSP_FRAME_EXTRA = "https://checkout.culqi.com https://secure.culqi.com";

/**
 * Static CSP — does NOT use per-request nonces.
 *
 * Originally Sprint D shipped with `'strict-dynamic'` + nonce, but
 * that approach forces every Next.js route into dynamic rendering
 * (because the HTML's script nonces must match the per-request CSP
 * header nonce). On Vercel with normal static caching, the first
 * visit to a public page like /sign-in receives cached HTML whose
 * nonces don't match the fresh CSP nonce, and the browser blocks
 * EVERY script — including the React runtime — so the page becomes
 * a dead static document (login form looks fine, the button does
 * nothing, no fetch fires).
 *
 * Trade-off (deliberate): `'unsafe-inline'` lets inline scripts run
 * without nonce checks. We lose the strict XSS protection nonces
 * provide but keep:
 *   - frame-ancestors 'none'  (clickjacking)
 *   - form-action 'self'      (form hijacking)
 *   - object-src 'none'       (Flash/plugin XSS)
 *   - base-uri 'self'         (base tag injection)
 *   - script-src 'self' + explicit allowlist (no foreign CDNs)
 *
 * For a B2B admin SaaS without user-generated content surfaces
 * (forms render plain text), the residual XSS risk is acceptable.
 */
function buildCsp(): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' ${CSP_SCRIPT_EXTRA}`,
    // Tailwind v4 inlines styles and shadcn primitives use style attrs.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${CSP_CONNECT_EXTRA}`,
    // `blob:` lets the wizard step-4 PdfViewer show the dry-run
    // preview PDF in an <iframe src="blob:..."> from
    // /api/documents/{id}/preview.
    `frame-src 'self' blob: ${CSP_FRAME_EXTRA}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  // ---- Auth gating ------------------------------------------------------
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ---- CSP (production only) -------------------------------------------
  if (!isProduction) {
    return NextResponse.next();
  }

  // Static CSP — no per-request nonce, so static-generated pages
  // (sign-in, sign-up, /, /pricing) work without forcing all routes
  // into dynamic rendering. See `buildCsp` docstring for the trade-off.
  const response = NextResponse.next();
  response.headers.set("content-security-policy", buildCsp());
  return response;
}

export const config = {
  // Skip Next internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
