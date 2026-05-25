/**
 * DocuGob — fetch wrapper for the Next.js `/api/*` proxy.
 *
 * Sprint C — the browser only knows about `/api/*`. Cookies are sent
 * automatically (same-origin, `credentials: "include"` not even
 * required) and the proxy on the Next.js server handles auth headers
 * + silent JWT refresh.
 *
 * Responsibilities that remain here:
 *  - Unwrap the standard `{success, message, data, errors}` envelope.
 *  - Surface a typed `ApiError` with the backend's error message.
 *
 * Usage:
 *    const me = await api.get<UserWithTenant>("/auth/me");
 *    await api.post("/documents", { ... });
 */

import { API_V1, DEBUG_API } from "./config";
import { logger } from "@/lib/logger";

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
  /**
   * No-op kept for backward compatibility with the previous client.
   * Auth is decided server-side by the proxy.
   */
  skipAuth?: boolean;
  /** Return the raw `Response` (rare; used by file downloads). */
  rawResponse?: boolean;
  /** Pass-through fetch options (signal, cache, etc.). */
  fetchOptions?: RequestInit;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const url = path.startsWith("/") ? `${API_V1}${path}` : `${API_V1}/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.fetchOptions?.headers as Record<string, string> | undefined),
  };

  if (DEBUG_API) logger.debug(`[api] ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Same-origin — cookies are sent by default, but be explicit so
    // misconfigured fetch wrappers can't strip them.
    credentials: "same-origin",
    ...options.fetchOptions,
  });

  if (options.rawResponse) {
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
