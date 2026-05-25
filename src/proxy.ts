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

function buildCsp(nonce: string): string {
  // `strict-dynamic` lets nonce-trusted scripts load further scripts
  // without listing every CDN explicitly. `'unsafe-inline'` is the
  // fallback Safari/older browsers honor when `strict-dynamic` is
  // ignored. Combined they give defense in depth.
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' ${CSP_SCRIPT_EXTRA}`,
    // Tailwind v4 inlines styles, and shadcn primitives use inline style attrs.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${CSP_CONNECT_EXTRA}`,
    `frame-src ${CSP_FRAME_EXTRA}`,
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

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Skip Next internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
