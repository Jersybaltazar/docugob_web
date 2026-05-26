/**
 * DocuGob — Next.js instrumentation hook.
 *
 * Loads the right Sentry runtime config based on whether the process
 * is the Node server or the Edge runtime. Re-export `onRequestError`
 * so Sentry captures errors thrown by Server Components and Route
 * Handlers automatically.
 */

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
