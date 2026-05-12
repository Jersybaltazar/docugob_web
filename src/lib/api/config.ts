/**
 * DocuGob — API client configuration.
 *
 * Single source of truth for the FastAPI base URL. We read it from
 * `NEXT_PUBLIC_API_BASE_URL` so the same build works in dev, staging
 * and production by swapping the env var.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const API_V1 = `${API_BASE_URL}/api/v1`;

export const DEBUG_API = process.env.NEXT_PUBLIC_DEBUG_API === "true";
