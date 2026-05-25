/**
 * GET /api/auth/refresh-redirect?to=<path>
 *
 * Bounce target used by Server Components when the access cookie is
 * present but FastAPI returned 401 (or the access cookie is missing
 * but the refresh cookie is valid). RSCs cannot mutate cookies, so
 * they redirect here and we do the token rotation server-side, then
 * redirect back to the original destination.
 *
 * Security: `to` is sanitized to relative same-origin paths — never
 * blindly forward to a user-supplied URL (open-redirect class).
 *
 * If the refresh exchange fails (expired / revoked), we clear the
 * cookies and send the user to /sign-in with the original
 * destination preserved in `redirect=`.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  REFRESH_COOKIE,
  clearAuthCookies,
  writeAuthCookies,
} from "@/lib/server/auth-cookies";
import { callFastapi } from "@/lib/server/api-proxy";

type TokenPair = { access_token: string; refresh_token: string };

/**
 * Only allow same-origin relative paths starting with a single "/".
 * Rejects protocol-relative URLs ("//evil.com") and absolute URLs.
 */
function safeDestination(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function GET(req: NextRequest) {
  const dest = safeDestination(req.nextUrl.searchParams.get("to"));
  const signInUrl = new URL(
    `/sign-in?redirect=${encodeURIComponent(dest)}`,
    req.url
  );

  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (!refresh) {
    clearAuthCookies(jar);
    return NextResponse.redirect(signInUrl);
  }

  const { status, envelope } = await callFastapi<TokenPair>("/auth/refresh", {
    method: "POST",
    body: { refresh_token: refresh },
  });

  if (
    status >= 200 &&
    status < 300 &&
    envelope?.success &&
    envelope.data
  ) {
    writeAuthCookies(jar, {
      access: envelope.data.access_token,
      refresh: envelope.data.refresh_token,
    });
    return NextResponse.redirect(new URL(dest, req.url));
  }

  clearAuthCookies(jar);
  return NextResponse.redirect(signInUrl);
}
