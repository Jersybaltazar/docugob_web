/**
 * DocuGob — Sentry server runtime config.
 *
 * Captures errors thrown by Next.js Server Components, Route Handlers
 * and Server Actions. Activated only when `NEXT_PUBLIC_SENTRY_DSN` is
 * set; otherwise this file is a no-op import.
 */

import * as Sentry from "@sentry/nextjs";

import { IGNORE_ERRORS, beforeSend } from "@/lib/sentry-scrubber";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    // Strict PII policy — see lib/sentry-scrubber.ts.
    sendDefaultPii: false,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0,
    ),
    ignoreErrors: IGNORE_ERRORS,
    beforeSend,
  });
}
