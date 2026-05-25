/**
 * DocuGob — API client configuration.
 *
 * Sprint C — the browser only talks to `/api/*` on the same origin.
 * Our Next.js route handlers proxy to FastAPI server-side, injecting
 * the access token from HttpOnly cookies.
 *
 * No env variable is required here anymore — the upstream URL lives in
 * `lib/server/fastapi.ts` and is server-only.
 */

export const API_V1 = "/api";

export const DEBUG_API = process.env.NEXT_PUBLIC_DEBUG_API === "true";
