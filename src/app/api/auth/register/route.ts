/**
 * POST /api/auth/register
 *
 * Same flow as `/api/auth/login`: forward to FastAPI, then set
 * HttpOnly cookies from the returned token pair so the newly created
 * user is logged in without a second round-trip.
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
    "/auth/register",
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

    return envelope(200, {
      success: true,
      message: payload.message ?? "Cuenta creada",
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
