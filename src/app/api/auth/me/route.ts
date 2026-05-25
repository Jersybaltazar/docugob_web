/**
 * GET /api/auth/me
 *
 * Thin alias over `/users/me` so the client only has to know about the
 * `/api/auth/*` family for everything session-related. The proxy
 * handles the access token injection and silent refresh.
 */

import { proxyToFastapi } from "@/lib/server/api-proxy";

export async function GET(req: Request) {
  return proxyToFastapi(req, { upstreamPath: "/users/me" });
}
