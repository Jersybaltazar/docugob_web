/**
 * DocuGob — FastAPI proxy (server-only).
 *
 * AUDIT §10.1 + Sprint C — the browser only talks to `/api/*`. This
 * helper handles every cross-domain concern for us:
 *   1. Read the access token from the HttpOnly cookie.
 *   2. Inject `Authorization: Bearer <access>` and forward the request.
 *   3. On 401, exchange the refresh token, rotate both cookies, retry
 *      once. If refresh fails, clear cookies and bubble the 401.
 *
 * The result is returned as a `NextResponse` so the route handler that
 * wraps us can simply `return await proxyToFastapi(...)`.
 */

import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  writeAuthCookies,
} from "./auth-cookies";
import { FASTAPI_V1, type FastapiEnvelope } from "./fastapi";

type ProxyOptions = {
  /** When true, the upstream is called without an Authorization header. */
  skipAuth?: boolean;
  /** Override the FastAPI path (defaults to the incoming request's path stripped of the `/api` prefix). */
  upstreamPath?: string;
  /** Override the HTTP method (defaults to the incoming request's method). */
  method?: string;
  /** Pre-parsed body to send instead of streaming the incoming request body. */
  body?: BodyInit | null;
  /** Headers to set on the upstream request (Content-Type defaults to JSON for JSON bodies). */
  headers?: Record<string, string>;
};

/**
 * Forward HTTP headers that matter to FastAPI: Content-Type, Accept,
 * Accept-Language. We deliberately DO NOT forward cookies, Authorization,
 * X-Forwarded-* — those are decided server-side.
 */
function forwardHeaders(req: Request, extra?: Record<string, string>) {
  const headers: Record<string, string> = {};
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;
  const accept = req.headers.get("accept");
  if (accept) headers["accept"] = accept;
  const lang = req.headers.get("accept-language");
  if (lang) headers["accept-language"] = lang;
  if (extra) Object.assign(headers, extra);
  return headers;
}

/**
 * Try to rotate the access token using the refresh cookie. Returns the
 * new access token on success, `null` on failure (refresh missing,
 * expired, or rejected by FastAPI).
 */
async function tryRefresh(): Promise<{
  access: string;
  refresh: string;
} | null> {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const res = await fetch(`${FASTAPI_V1}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const payload = (await res.json()) as FastapiEnvelope<{
    access_token: string;
    refresh_token: string;
  }>;
  if (!payload.success || !payload.data) return null;

  return {
    access: payload.data.access_token,
    refresh: payload.data.refresh_token,
  };
}

/**
 * Send a single upstream request with the given access token. Returns
 * the raw `Response` so the caller can choose to retry on 401.
 */
async function callUpstream(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: BodyInit | null | undefined,
  accessToken: string | null
): Promise<Response> {
  const finalHeaders: Record<string, string> = { ...headers };
  if (accessToken) finalHeaders["authorization"] = `Bearer ${accessToken}`;
  return fetch(url, {
    method,
    headers: finalHeaders,
    body,
    cache: "no-store",
    // Don't follow redirects — return them to the client.
    redirect: "manual",
  });
}

/**
 * Stream the FastAPI response back to the browser, copying the status,
 * body and the headers that matter (content-type, content-disposition,
 * cache-control). Note: cookies are NOT forwarded — auth cookies are
 * managed by `writeAuthCookies` / `clearAuthCookies`.
 */
function relayResponse(upstream: Response): NextResponse {
  const headers = new Headers();
  const passthrough = [
    "content-type",
    "content-disposition",
    "content-language",
    "cache-control",
    "etag",
    "last-modified",
  ];
  for (const name of passthrough) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Forward any custom `X-*` header the backend chose to set. Common
  // case: `X-Preview-Format` from /documents/{id}/preview tells the
  // client whether the body is PDF or a .docx fallback.
  upstream.headers.forEach((value, name) => {
    if (name.toLowerCase().startsWith("x-")) {
      headers.set(name, value);
    }
  });
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

/**
 * Main proxy entry point.
 *
 *   const res = await proxyToFastapi(req, { upstreamPath: "/users/me" });
 *   return res;
 *
 * If `upstreamPath` is omitted we derive it by stripping the `/api`
 * prefix from `req.nextUrl.pathname` — handy for the catch-all route.
 */
export async function proxyToFastapi(
  req: Request,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const reqUrl = new URL(req.url);
  const inboundPath = reqUrl.pathname.replace(/^\/api/, "") || "/";
  const upstreamPath = options.upstreamPath ?? inboundPath;
  const query = reqUrl.search; // includes the leading "?"
  const upstreamUrl = `${FASTAPI_V1}${upstreamPath}${query}`;

  const method = (options.method ?? req.method).toUpperCase();
  const headers = forwardHeaders(req, options.headers);

  // Prefer a pre-parsed body when the caller has already consumed
  // the incoming stream (auth routes do this). Otherwise stream the
  // incoming body if there is one.
  const hasBody = method !== "GET" && method !== "HEAD";
  const body: BodyInit | null | undefined = hasBody
    ? (options.body ?? (req.body as BodyInit | null))
    : undefined;

  // Streaming the request body requires Node's experimental "duplex"
  // flag in fetch options. Buffer small JSON bodies into memory.
  let resolvedBody: BodyInit | null | undefined = body;
  if (hasBody && options.body === undefined && req.body) {
    const buffered = await req.arrayBuffer();
    resolvedBody = buffered.byteLength > 0 ? buffered : null;
  }

  const jar = await cookies();
  const accessToken = options.skipAuth
    ? null
    : (jar.get(ACCESS_COOKIE)?.value ?? null);

  let upstream = await callUpstream(
    upstreamUrl,
    method,
    headers,
    resolvedBody ?? null,
    accessToken
  );

  // 401 + we have a refresh cookie + this isn't the refresh endpoint
  // → rotate and retry once.
  if (upstream.status === 401 && !options.skipAuth) {
    const rotated = await tryRefresh();
    if (rotated) {
      writeAuthCookies(jar, rotated);
      upstream = await callUpstream(
        upstreamUrl,
        method,
        headers,
        resolvedBody ?? null,
        rotated.access
      );
    } else {
      clearAuthCookies(jar);
    }
  }

  return relayResponse(upstream);
}

/**
 * Convenience wrapper for auth route handlers that need to call
 * FastAPI directly with a custom body (login, register). Returns the
 * parsed JSON envelope so the handler can pick out `data.access_token`
 * and set cookies.
 */
export async function callFastapi<T>(
  path: string,
  init: {
    method: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; envelope: FastapiEnvelope<T> | null }> {
  const res = await fetch(`${FASTAPI_V1}${path}`, {
    method: init.method,
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  let envelope: FastapiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as FastapiEnvelope<T>;
  } catch {
    // Non-JSON response (e.g. 502 from a gateway).
  }
  return { status: res.status, envelope };
}
