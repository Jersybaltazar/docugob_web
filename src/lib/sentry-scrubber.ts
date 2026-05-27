/**
 * DocuGob — Shared Sentry PII scrubber.
 *
 * Sentry sends events to a third-party processor (US-based). Ley 29733
 * lists Sentry as `encargado del tratamiento` only for technical
 * metadata. We strip emails, JWTs, passwords, tokens and identifiers
 * BEFORE they leave the process so the scope of the transfer stays
 * narrow.
 */

import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Patterns that mark dev / build-tooling noise we never want in Sentry:
 *  - Turbopack chunk lifecycle errors during HMR.
 *  - Next.js dynamic import failures after a stale chunk.
 *  - Browser-extension crashes (we're not the cause and can't fix them).
 *  - User-cancelled navigation / aborted fetches.
 *
 * Sentry matches each entry against the exception value (string) or as
 * a RegExp; we mix both. Passed to `Sentry.init({ ignoreErrors })` in
 * every runtime config.
 */
export const IGNORE_ERRORS: (string | RegExp)[] = [
  // Turbopack / Webpack chunk lifecycle during HMR.
  /module factory is not available/i,
  /ChunkLoadError/i,
  /Loading chunk [\d]+ failed/i,
  /Loading CSS chunk/i,
  /Failed to fetch dynamically imported module/i,
  // The Next.js router throws this when navigation is interrupted by
  // another navigation — not a real bug.
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  // Aborted fetch / user-cancelled requests.
  "AbortError: The user aborted a request",
  "TypeError: cancelled",
  /^cancelled$/i,
  // Browser extensions injecting code that crashes.
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
];

const SENSITIVE_KEYS = new Set([
  "password",
  "new_password",
  "current_password",
  "token",
  "access_token",
  "refresh_token",
  "hashed_password",
  "secret",
  "client_secret",
  "api_key",
  "jwt",
  "authorization",
  "cookie",
  "email",
  "full_name",
  "ruc",
  "dni",
]);

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const JWT_RE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const REDACTED = "[REDACTED]";

function scrubString(value: string): string {
  return value.replace(EMAIL_RE, REDACTED).replace(JWT_RE, REDACTED);
}

function scrub(value: unknown): unknown {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : scrub(raw);
    }
    return out;
  }
  return value;
}

export function beforeSend(event: ErrorEvent): ErrorEvent | null {
  // 1. Drop the auto-attached user identity.
  event.user = {};

  // 2. Request body, query string, headers, cookies.
  if (event.request) {
    if (event.request.headers) {
      event.request.headers = scrub(event.request.headers) as Record<
        string,
        string
      >;
    }
    if (event.request.cookies) {
      event.request.cookies = {};
    }
    if (event.request.data) {
      event.request.data = scrub(event.request.data);
    }
    if (event.request.query_string) {
      event.request.query_string = REDACTED;
    }
  }

  // 3. Breadcrumbs.
  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) {
      if (crumb.message) crumb.message = scrubString(crumb.message);
      if (crumb.data) crumb.data = scrub(crumb.data) as typeof crumb.data;
    }
  }

  // 4. Extra context.
  if (event.extra) {
    event.extra = scrub(event.extra) as typeof event.extra;
  }
  if (event.contexts) {
    event.contexts = scrub(event.contexts) as typeof event.contexts;
  }

  // 5. Exception messages (can include "duplicate email foo@bar.com").
  if (event.exception?.values) {
    for (const exc of event.exception.values) {
      if (exc.value) exc.value = scrubString(exc.value);
    }
  }

  return event;
}
