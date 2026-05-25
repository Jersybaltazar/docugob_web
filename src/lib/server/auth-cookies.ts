/**
 * DocuGob — HttpOnly cookie helpers (server-only).
 *
 * AUDIT §10 + Sprint C — access/refresh tokens live in HttpOnly cookies
 * set by route handlers, NOT in localStorage. This file is the single
 * place where the cookie names, flags and lifetimes are decided.
 *
 * Never import from a Client Component — `next/headers` is server-only.
 */

import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "docugob_access";
export const REFRESH_COOKIE = "docugob_refresh";

// 7 days for both. The access token's real expiry is enforced by the
// FastAPI verifier; the cookie maxAge only controls when the browser
// stops sending it. We let the access cookie persist as long as the
// refresh window so the proxy can silently rotate it.
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const isProduction = process.env.NODE_ENV === "production";

type CookieJar = Awaited<ReturnType<typeof cookies>>;

function baseAttrs() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

/**
 * Set both auth cookies on a mutable cookie jar (obtained inside a
 * route handler via `await cookies()`).
 */
export function writeAuthCookies(
  jar: CookieJar,
  tokens: { access: string; refresh: string }
): void {
  jar.set(ACCESS_COOKIE, tokens.access, baseAttrs());
  jar.set(REFRESH_COOKIE, tokens.refresh, baseAttrs());
}

export function clearAuthCookies(jar: CookieJar): void {
  jar.set(ACCESS_COOKIE, "", { ...baseAttrs(), maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { ...baseAttrs(), maxAge: 0 });
}

/**
 * Read the current access / refresh values. Returns `null` for each
 * missing cookie — callers decide what to do with the absence.
 */
export async function readAuthCookies(): Promise<{
  access: string | null;
  refresh: string | null;
}> {
  const jar = await cookies();
  return {
    access: jar.get(ACCESS_COOKIE)?.value ?? null,
    refresh: jar.get(REFRESH_COOKIE)?.value ?? null,
  };
}
