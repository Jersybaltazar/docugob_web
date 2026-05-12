/**
 * DocuGob — fetch wrapper for the FastAPI backend.
 *
 * Responsibilities:
 *  - Inject the JWT access token on every request.
 *  - On 401 with an expired access token, transparently refresh and retry once.
 *  - Unwrap the standard {success, message, data, errors} envelope and
 *    surface a typed Error with the backend's error message.
 *
 * Usage:
 *    const tokens = await api.post<TokenResponse>("/auth/login", { ... });
 *    const me = await api.get<UserWithTenant>("/users/me");
 */

import { API_V1, DEBUG_API } from "./config";
import { tokenStorage } from "@/lib/auth/storage";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[] | null;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  /** Skip token attachment (used for login/register/refresh). */
  skipAuth?: boolean;
  /** Internal — set to true after a refresh attempt to avoid loops. */
  _retried?: boolean;
  /** Override the standard envelope unwrap (rare; used by file downloads). */
  rawResponse?: boolean;
  /** Pass-through fetch options (signal, cache, etc.). */
  fetchOptions?: RequestInit;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = tokenStorage.getRefresh();
    if (!refresh) return false;

    try {
      const res = await fetch(`${API_V1}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        tokenStorage.clear();
        return false;
      }
      const body = (await res.json()) as ApiEnvelope<{
        access_token: string;
        refresh_token: string;
      }>;
      if (!body.success || !body.data) {
        tokenStorage.clear();
        return false;
      }
      tokenStorage.set(body.data.access_token, body.data.refresh_token);
      return true;
    } catch (e) {
      if (DEBUG_API) console.warn("refresh failed", e);
      tokenStorage.clear();
      return false;
    } finally {
      // Release the lock at the end of the microtask so concurrent
      // 401-retries observe the same outcome.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_V1}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.fetchOptions?.headers as Record<string, string> | undefined),
  };

  if (!options.skipAuth) {
    const token = tokenStorage.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (DEBUG_API) console.debug(`[api] ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options.fetchOptions,
  });

  // Auto-refresh on access expiry (only one retry allowed).
  if (res.status === 401 && !options.skipAuth && !options._retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(method, path, body, { ...options, _retried: true });
    }
    tokenStorage.clear();
  }

  if (options.rawResponse) {
    // Caller wants the raw Response (e.g., binary download).
    return res as unknown as T;
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // Body wasn't JSON
  }

  if (!res.ok) {
    const message =
      payload?.message ??
      payload?.errors?.[0] ??
      `HTTP ${res.status} ${res.statusText}`;
    throw new ApiError(message, res.status, payload?.errors ?? undefined);
  }

  if (payload && payload.success === false) {
    throw new ApiError(
      payload.message ?? "Request failed",
      res.status,
      payload.errors ?? undefined
    );
  }

  return (payload?.data as T) ?? (undefined as unknown as T);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
