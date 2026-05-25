/**
 * Catch-all proxy for FastAPI.
 *
 * Anything under `/api/foo/bar` that doesn't match a more specific
 * route (`/api/auth/*`, etc.) is forwarded to `FASTAPI_V1/foo/bar` by
 * `proxyToFastapi`. The proxy injects the access token from the
 * HttpOnly cookie and transparently refreshes on 401.
 *
 * This file is the SECOND-tier router — more specific routes in
 * `app/api/...` take precedence in Next.js' route matcher.
 */

import { proxyToFastapi } from "@/lib/server/api-proxy";

export async function GET(req: Request) {
  return proxyToFastapi(req);
}
export async function POST(req: Request) {
  return proxyToFastapi(req);
}
export async function PATCH(req: Request) {
  return proxyToFastapi(req);
}
export async function PUT(req: Request) {
  return proxyToFastapi(req);
}
export async function DELETE(req: Request) {
  return proxyToFastapi(req);
}
