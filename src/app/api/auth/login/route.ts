/**
 * POST /api/auth/login
 *
 * The browser hits this route instead of FastAPI. We:
 *   1. Forward the credentials to FastAPI `/auth/login`.
 *   2. On success, set HttpOnly cookies with the token pair.
 *   3. Return the user (sans tokens) so the client cache can hydrate
 *      without a second round-trip.
 *
 * On failure we relay the FastAPI envelope verbatim so the existing
 * `ApiError` parsing in `lib/api/client.ts` keeps working.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { writeAuthCookies } from "@/lib/server/auth-cookies";
import { callFastapi } from "@/lib/server/api-proxy";
import type { FastapiEnvelope } from "@/lib/server/fastapi";

type TokenPair = { access_token: string; refresh_token: string };

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return envelope(400, { success: false, message: "JSON inválido" });
  }

  const { status, envelope: payload } = await callFastapi<TokenPair>(
    "/auth/login",
    { method: "POST", body }
  );

  if (!payload) {
    return envelope(status || 502, {
      success: false,
      message: "Upstream sin respuesta",
    });
  }

  if (status >= 200 && status < 300 && payload.success && payload.data) {
    const jar = await cookies();
    writeAuthCookies(jar, {
      access: payload.data.access_token,
      refresh: payload.data.refresh_token,
    });

    // Don't leak the tokens to JS — the cookie is enough.
    return envelope(200, {
      success: true,
      message: payload.message ?? "Sesión iniciada",
      data: { logged_in: true },
    });
  }

  return envelope(status, payload);
}

function envelope<T>(
  status: number,
  payload: Partial<FastapiEnvelope<T>>
): NextResponse {
  return NextResponse.json(
    {
      success: payload.success ?? false,
      message: payload.message ?? "",
      data: payload.data ?? null,
      errors: payload.errors ?? null,
    },
    { status }
  );
}
