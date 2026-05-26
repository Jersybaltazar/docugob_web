/**
 * DocuGob — Sentry browser runtime config.
 *
 * Loaded by Next.js on the client. Captures unhandled exceptions and
 * unhandled promise rejections in the browser tab. Activated only when
 * `NEXT_PUBLIC_SENTRY_DSN` is set.
 */

import * as Sentry from "@sentry/nextjs";

import { beforeSend } from "@/lib/sentry-scrubber";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0,
    ),
    // Session replay can capture screen content and is OFF by default.
    // Don't enable without revising the privacy policy first — replays
    // include keystrokes by default unless you mask everything.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
