/**
 * DocuGob — Auth API surface.
 */

import { api } from "./client";
import type { TokenResponse, UserWithTenant } from "./types";

export const authApi = {
  register(params: {
    email: string;
    password: string;
    full_name: string;
    tenant_name: string;
  }): Promise<TokenResponse> {
    return api.post<TokenResponse>("/auth/register", params, { skipAuth: true });
  },

  login(params: { email: string; password: string }): Promise<TokenResponse> {
    return api.post<TokenResponse>("/auth/login", params, { skipAuth: true });
  },

  refresh(refresh_token: string): Promise<TokenResponse> {
    return api.post<TokenResponse>(
      "/auth/refresh",
      { refresh_token },
      { skipAuth: true }
    );
  },

  me(): Promise<UserWithTenant> {
    return api.get<UserWithTenant>("/users/me");
  },
};
