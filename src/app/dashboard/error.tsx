"use client";

/**
 * DocuGob — Dashboard segment error boundary (AUDIT §11.13).
 *
 * Catches any uncaught error in /dashboard/* and offers a recovery
 * action via Next's `reset()`. Forwards to Sentry and surfaces the
 * resulting event id so the user can quote it to support — we look it
 * up in seconds.
 */

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Capture once during the first render. Sentry de-duplicates by
  // stack trace, so even if React mounts us twice (Strict Mode) the
  // event id stays stable.
  const [eventId] = useState<string | null>(
    () => Sentry.captureException(error) || null,
  );

  useEffect(() => {
    logger.error("[dashboard] segment crashed", error);
  }, [error]);

  // Prefer Sentry's event id (works in dev too); fall back to Next's
  // `digest` (only present in production builds).
  const trackingCode = eventId ?? error.digest ?? null;

  return (
    <div className="mx-auto max-w-xl py-16 text-center" role="alert">
      <div className="mx-auto mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">
        Algo salió mal
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No pudimos cargar esta sección. Intenta de nuevo en unos
        segundos.
      </p>
      {trackingCode && (
        <p className="mt-2 text-xs text-muted-foreground">
          Si el problema persiste, comparte este código con soporte:{" "}
          <span className="font-mono">{trackingCode.slice(0, 8)}</span>
        </p>
      )}
      <div className="mt-6">
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
