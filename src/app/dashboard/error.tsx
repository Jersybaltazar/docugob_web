"use client";

/**
 * DocuGob — Dashboard segment error boundary (AUDIT §11.13).
 *
 * Catches any uncaught error in /dashboard/* and offers a recovery
 * action via Next's `reset()`. The actual error is sent to the logger
 * — when Sentry/Axiom land (Sprint 9+) they'll auto-capture from here.
 */

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[dashboard] segment crashed", error);
  }, [error]);

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
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">
          Código de error: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <div className="mt-6">
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
