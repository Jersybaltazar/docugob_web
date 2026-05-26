/**
 * DocuGob — Auth API surface (browser).
 *
 * Sprint C — these helpers call Next.js route handlers under
 * `/api/auth/*`, which forward to FastAPI server-side and manage the
 * HttpOnly cookies. The browser never sees the JWTs.
 */

import { api } from "./client";
import type { UserWithTenant } from "./types";

type LoggedInAck = { logged_in: boolean };
type AuthAck = { ok: boolean };

export const authApi = {
  register(params: {
    email: string;
    password: string;
    full_name: string;
    tenant_name: string;
  }): Promise<LoggedInAck> {
    return api.post<LoggedInAck>("/auth/register", params);
  },

  login(params: { email: string; password: string }): Promise<LoggedInAck> {
    return api.post<LoggedInAck>("/auth/login", params);
  },

  logout(): Promise<LoggedInAck> {
    return api.post<LoggedInAck>("/auth/logout");
  },

  me(): Promise<UserWithTenant> {
    return api.get<UserWithTenant>("/auth/me");
  },

  requestPasswordReset(params: { email: string }): Promise<AuthAck> {
    return api.post<AuthAck>("/auth/password-reset/request", params);
  },

  confirmPasswordReset(params: {
    token: string;
    password: string;
  }): Promise<AuthAck> {
    return api.post<AuthAck>("/auth/password-reset/confirm", params);
  },

  confirmEmailVerification(params: { token: string }): Promise<AuthAck> {
    return api.post<AuthAck>("/auth/verify-email/confirm", params);
  },

  resendEmailVerification(): Promise<AuthAck> {
    return api.post<AuthAck>("/auth/verify-email/resend");
  },
};
