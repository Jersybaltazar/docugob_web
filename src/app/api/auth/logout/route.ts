/**
 * POST /api/auth/logout
 *
 * Idempotent: clears auth cookies regardless of whether the session
 * existed. We don't attempt to revoke the token upstream — FastAPI
 * relies on token expiry — but a future sprint can add that here.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { clearAuthCookies } from "@/lib/server/auth-cookies";

export async function POST() {
  const jar = await cookies();
  clearAuthCookies(jar);
  return NextResponse.json({
    success: true,
    message: "Sesión cerrada",
    data: { logged_in: false },
    errors: null,
  });
}
