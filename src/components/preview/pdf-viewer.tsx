"use client";

/**
 * DocuGob — Inline PDF viewer.
 *
 * The backend returns the generated PDF behind an authenticated
 * download endpoint, so we can't point an `<iframe src>` at it
 * directly (the embed wouldn't send the Bearer token). Instead we
 * fetch the blob ourselves and feed it to the iframe via
 * `URL.createObjectURL`.
 *
 * Most desktop browsers ship a native PDF renderer that handles the
 * blob URL out of the box (Chrome / Edge / Firefox / Safari). On
 * mobile we fall back to a download CTA — see the empty state below.
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { documentsApi } from "@/lib/api/documents";

type Props = {
  documentId: string | null | undefined;
  /** Backend-side URL; we use it only to detect whether a PDF exists. */
  pdfUrl: string | null | undefined;
  className?: string;
};

export function PdfViewer({ documentId, pdfUrl, className }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // React 19 — when the inputs change, reset loader state during
  // render (not in an effect). The effect below then performs the
  // async fetch in a clean slate.
  const inputKey = `${documentId ?? ""}|${pdfUrl ?? ""}`;
  const [lastInputKey, setLastInputKey] = useState(inputKey);
  if (lastInputKey !== inputKey) {
    setLastInputKey(inputKey);
    setObjectUrl(null);
    setError(null);
  }

  useEffect(() => {
    if (!documentId || !pdfUrl) return;

    let revoked = false;
    let currentUrl: string | null = null;

    (async () => {
      try {
        const blob = await documentsApi.download(documentId, "pdf");
        if (revoked) return;
        currentUrl = URL.createObjectURL(blob);
        setObjectUrl(currentUrl);
      } catch (err) {
        if (!revoked) {
          setError(
            err instanceof Error ? err.message : "No se pudo cargar el PDF"
          );
        }
      }
    })();

    return () => {
      revoked = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [documentId, pdfUrl]);

  if (!pdfUrl) {
    return (
      <div className={className}>
        <div className="rounded-md border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          La conversión a PDF no está disponible en este servidor. Descarga el
          .docx desde el botón de la derecha — se ve idéntico al PDF al
          abrirlo en Word.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div className={className}>
        <div className="flex h-[640px] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando PDF...
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={objectUrl}
      title="Vista previa del documento generado (PDF)"
      className={className}
      style={{ minHeight: 640, width: "100%", border: 0 }}
    />
  );
}
