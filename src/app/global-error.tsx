"use client";

/**
 * DocuGob — Root error boundary.
 *
 * Catches errors that bubble past every nested boundary, including
 * crashes in the root layout itself. Because the root layout failed
 * to render, this component MUST own its own <html> and <body>.
 *
 * We keep the markup minimal (no Tailwind, no providers) so it works
 * even if the stylesheet or the React Query provider is the thing
 * that crashed.
 */

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Capture once during the first render. Sentry de-duplicates by
  // stack trace, so we don't need a useEffect-after-mount dance here.
  const [eventId] = useState<string | null>(
    () => Sentry.captureException(error) || null,
  );

  const trackingCode = eventId ?? error.digest ?? null;

  return (
    <html lang="es-PE">
      <body
        style={{
          margin: 0,
          padding: "4rem 1.5rem",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f6f7f9",
          color: "#1a2238",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          role="alert"
          style={{
            maxWidth: 520,
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
            Algo salió mal
          </h1>
          <p
            style={{
              marginTop: 12,
              color: "#5b6675",
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            La aplicación encontró un error inesperado. Intenta recargar
            la página; si el problema persiste, contáctanos.
          </p>
          {trackingCode && (
            <p
              style={{
                marginTop: 12,
                color: "#5b6675",
                fontSize: 12,
              }}
            >
              Código de error:{" "}
              <span style={{ fontFamily: "ui-monospace, monospace" }}>
                {trackingCode.slice(0, 8)}
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#1a2a52",
              color: "#ffffff",
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
