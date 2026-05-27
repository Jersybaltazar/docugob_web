/**
 * POST /api/auth/accept-invitation
 *
 * Mirrors the login route: forwards the body to FastAPI, sets the
 * HttpOnly cookies with the returned token pair, and replies with a
 * `{ logged_in: true }` envelope so the browser can pivot to the
 * dashboard without ever seeing the JWTs.
 *
 * Body: { token, full_name?, password? }
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { writeAuthCookies } from "@/lib/server/auth-cookies";
import { callFastapi } from "@/lib/server/api-proxy";
import type { FastapiEnvelope } from "@/lib/server/fastapi";

type TokenPair = { access_token: string; refresh_token: string };

type Body = {
  token?: string;
  full_name?: string;
  password?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return envelope(400, { success: false, message: "JSON inválido" });
  }

  const token = (body.token ?? "").trim();
  if (!token) {
    return envelope(400, { success: false, message: "Falta el token" });
  }

  const upstreamBody = {
    full_name: body.full_name,
    password: body.password,
  };

  const { status, envelope: payload } = await callFastapi<TokenPair>(
    `/auth/invitations/${encodeURIComponent(token)}/accept`,
    { method: "POST", body: upstreamBody },
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
      message: payload.message ?? "Invitación aceptada",
      data: { logged_in: true },
    });
  }

  return envelope(status, payload);
}

function envelope<T>(
  status: number,
  payload: Partial<FastapiEnvelope<T>>,
): NextResponse {
  return NextResponse.json(
    {
      success: payload.success ?? false,
      message: payload.message ?? "",
      data: payload.data ?? null,
      errors: payload.errors ?? null,
    },
    { status },
  );
}
