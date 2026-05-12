/**
 * DocuGob — Token storage.
 *
 * MVP storage strategy: access + refresh tokens in localStorage. This is
 * simple and works for a SPA flow. The trade-off is XSS exposure;
 * we mitigate it with strict CSP headers in Sprint 6 deploy.
 *
 * Sprint 9 will move refresh tokens to an HttpOnly cookie set by an
 * /auth/refresh proxy route (Next.js route handler).
 */

const ACCESS_TOKEN_KEY = "docugob.access_token";
const REFRESH_TOKEN_KEY = "docugob.refresh_token";

/**
 * Non-sensitive presence cookie read by the Next.js middleware to gate
 * /dashboard routes before any client JS runs. It does NOT contain the
 * JWT — just a "1" flag. The real tokens stay in localStorage.
 */
const SESSION_COOKIE = "docugob_session";

function setSessionCookie(): void {
  if (typeof document === "undefined") return;
  // 7 days, the refresh token lifetime. SameSite=Lax keeps the cookie
  // out of cross-site contexts while letting top-level GETs work.
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`;
}

function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export const tokenStorage = {
  getAccess(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(access: string, refresh: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    setSessionCookie();
  },
  setAccessOnly(access: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    setSessionCookie();
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearSessionCookie();
  },
  isAuthenticated(): boolean {
    return Boolean(this.getAccess());
  },
};

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
