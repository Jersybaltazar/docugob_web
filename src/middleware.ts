/**
 * DocuGob — Next.js middleware.
 *
 * Guards /dashboard/* routes using a non-sensitive presence cookie
 * (`docugob_session`) set by the auth flow. The cookie does NOT carry
 * the JWT — the real access/refresh tokens live in localStorage. The
 * cookie's only role is letting the server short-circuit unauthenticated
 * visits before any client JS runs (avoids a flash of dashboard UI).
 *
 * Authenticated users hitting /sign-in or /sign-up are redirected to
 * the dashboard so they don't see the marketing/auth pages twice.
 */

import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "docugob_session";
const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === "1";

  // Block protected routes when no session cookie is present.
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      // Preserve the original destination so we can bounce back after login.
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect already-authenticated users away from auth pages.
  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)",
  ],
};
