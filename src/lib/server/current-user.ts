/**
 * DocuGob — Server-side user fetch (Sprint D).
 *
 * AUDIT §3.1 — the dashboard layout is a Server Component; it reads
 * the access cookie and asks FastAPI for the current user *before*
 * any client JS boots. This eliminates the "Cargando tu cuenta…"
 * flash that the previous client-side layout produced.
 *
 * Wrapped in React's `cache()` so multiple RSC consumers in the same
 * request (layout + page) share a single network call.
 *
 * Three terminal states:
 *   - `ok`              → user is logged in, render the page
 *   - `refresh-needed`  → access expired but refresh cookie present;
 *                         caller bounces to /api/auth/refresh-redirect
 *                         to rotate cookies server-side
 *   - `anonymous`       → no usable credentials; caller bounces to
 *                         /sign-in (or treats user as null on pages
 *                         that allow anonymous access)
 */

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth-cookies";
import { FASTAPI_V1, type FastapiEnvelope } from "./fastapi";
import type { UserWithTenant } from "@/lib/api/types";

export type UserFetchResult =
  | { status: "ok"; user: UserWithTenant }
  | { status: "refresh-needed" }
  | { status: "anonymous" };

export const getCurrentUserServer = cache(
  async (): Promise<UserFetchResult> => {
    const jar = await cookies();
    const access = jar.get(ACCESS_COOKIE)?.value ?? null;
    const refresh = jar.get(REFRESH_COOKIE)?.value ?? null;

    if (!access && !refresh) return { status: "anonymous" };
    if (!access && refresh) return { status: "refresh-needed" };

    let res: Response;
    try {
      res = await fetch(`${FASTAPI_V1}/users/me`, {
        headers: { authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    } catch {
      // Upstream unreachable — treat as anonymous so the user sees
      // the sign-in flow instead of a hung shell.
      return { status: "anonymous" };
    }

    if (res.ok) {
      try {
        const envelope = (await res.json()) as FastapiEnvelope<UserWithTenant>;
        if (envelope.success && envelope.data) {
          return { status: "ok", user: envelope.data };
        }
      } catch {
        // Fall through to the anonymous path.
      }
    }

    // 401 with a refresh cookie → ask the route handler to rotate.
    if (res.status === 401 && refresh) return { status: "refresh-needed" };

    return { status: "anonymous" };
  }
);

/**
 * Convenience wrapper for pages that require an authenticated user.
 * Redirects to `/api/auth/refresh-redirect` (silent rotation) or
 * `/sign-in` (explicit re-login) when the session is unusable.
 */
export async function requireCurrentUser(
  targetPath: string
): Promise<UserWithTenant> {
  const result = await getCurrentUserServer();
  if (result.status === "ok") return result.user;
  if (result.status === "refresh-needed") {
    redirect(
      `/api/auth/refresh-redirect?to=${encodeURIComponent(targetPath)}`
    );
  }
  redirect(`/sign-in?redirect=${encodeURIComponent(targetPath)}`);
}

/**
 * For pages that work for both anonymous and authenticated visitors
 * (e.g. /pricing). Returns the user when available; transparently
 * bounces through the refresh endpoint when access is stale.
 */
export async function getOptionalUser(
  targetPath: string
): Promise<UserWithTenant | null> {
  const result = await getCurrentUserServer();
  if (result.status === "ok") return result.user;
  if (result.status === "refresh-needed") {
    redirect(
      `/api/auth/refresh-redirect?to=${encodeURIComponent(targetPath)}`
    );
  }
  return null;
}
