/**
 * DocuGob — FastAPI configuration (server-only).
 *
 * The browser never talks to FastAPI directly anymore (Sprint C). It
 * hits our Next.js route handlers under `/api/*` which call this host
 * server-side and inject the Authorization header from HttpOnly
 * cookies.
 *
 * Resolution order:
 *   1. `BACKEND_API_URL` (server-only, preferred)
 *   2. `NEXT_PUBLIC_API_BASE_URL` (legacy — kept for staging envs that
 *      still set the public variable)
 *   3. `http://127.0.0.1:8000` for local dev
 */

import "server-only";

const BACKEND =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

export const FASTAPI_BASE_URL = BACKEND;
export const FASTAPI_V1 = `${BACKEND}/api/v1`;

/**
 * Standard FastAPI envelope. Re-declared here so server code never
 * imports types from a Client Component module by accident.
 */
export type FastapiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[] | null;
};
