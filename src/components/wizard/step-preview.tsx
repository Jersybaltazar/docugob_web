"use client";

/**
 * DocuGob — Wizard Step 4: Faithful preview + Generate + Download.
 *
 * Sprint 8 — Vista previa fiel (Opción B). The preview pane renders
 * the actual PDF produced by the backend's dry-run pipeline, so the
 * user sees their letterhead, footer and AI-generated body exactly as
 * they will appear after "Generar". The dry-run does NOT consume a
 * correlative — that's reserved for the explicit Generate action.
 *
 * Lifecycle:
 *   - Auto-fetch the preview on first mount (when documentId exists).
 *   - "Actualizar vista previa" button re-renders on demand (so
 *     users editing in step 2/3 and coming back see fresh state).
 *   - Generate is unchanged — same correlative-allocating endpoint.
 *
 * Fallback: if LibreOffice isn't available, the backend returns the
 * .docx blob with `X-Preview-Format: docx`. We surface a download CTA
 * instead of an iframe.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { documentsApi } from "@/lib/api/documents";
import { ApiError } from "@/lib/api/client";
import {
  useGenerateDocument,
  usePreviewDocument,
} from "@/hooks/documents/use-documents";
import { useCurrentUser } from "@/hooks/auth/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { PdfViewer } from "@/components/preview/pdf-viewer";
import { useWizard } from "./wizard-context";
import { ActiveTemplateBadge } from "./active-template-badge";

export function StepPreview() {
  const {
    documentId,
    documentType,
    contentData,
    aiGeneratedBody,
    document: storedDoc,
    back,
    setDocument,
    reset,
  } = useWizard();
  const { data: user } = useCurrentUser();

  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);

  const generate = useGenerateDocument(documentId ?? "");
  const preview = usePreviewDocument(documentId ?? "");

  // Preview blob — survives across refresh button clicks. Revoke
  // object URLs on replacement and on unmount so we don't leak.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFormat, setPreviewFormat] = useState<"pdf" | "docx" | null>(
    null
  );

  const isGenerated =
    storedDoc?.status === "generated" ||
    storedDoc?.status === "reviewed" ||
    storedDoc?.status === "signed";

  const isFreePlan =
    (user?.current_tenant?.plan ?? "").toLowerCase() === "free";

  const refreshPreview = useCallback(() => {
    if (!documentId || isGenerated) return;
    preview.mutate(
      {
        content_data: contentData,
        ai_generated_body: aiGeneratedBody || undefined,
      },
      {
        onSuccess: ({ blob, format }) => {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
          setPreviewFormat(format);
        },
        onError: (err) => {
          const message =
            err instanceof Error
              ? err.message
              : "No se pudo generar la vista previa";
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        },
      }
    );
  }, [documentId, isGenerated, contentData, aiGeneratedBody, preview]);

  // Auto-fetch the preview the first time we have a documentId.
  // Adjust-state-during-render with `queueMicrotask` so the mutation
  // fires after this render commits — keeps us out of the
  // `react-hooks/set-state-in-effect` rule and `react-hooks/refs`
  // (no ref mutation during render).
  const [autoTriggeredFor, setAutoTriggeredFor] = useState<string | null>(
    null
  );
  if (
    documentId &&
    !isGenerated &&
    autoTriggeredFor !== documentId
  ) {
    setAutoTriggeredFor(documentId);
    queueMicrotask(refreshPreview);
  }

  // Revoke the object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleGenerate = async () => {
    if (!documentId) {
      toast({
        title: "Error",
        description: "Primero guarda el borrador en el paso 2",
        variant: "destructive",
      });
      return;
    }
    try {
      const doc = await generate.mutateAsync({
        content_data: contentData,
        ai_generated_body: aiGeneratedBody || undefined,
        generate_pdf: true,
      });
      setDocument(doc);
      toast({
        title: "Éxito",
        description: `Documento generado · ${doc.number ?? ""}`,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo generar el documento";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDownload = async (format_: "docx" | "pdf") => {
    if (!documentId) return;
    setDownloading(format_);
    try {
      const blob = await documentsApi.download(documentId, format_);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      const safeNumber =
        storedDoc?.number?.replace(/[\s/]/g, "-") ?? documentId;
      link.download = `${safeNumber}.${format_}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `No se pudo descargar el ${format_}`;
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPreviewDocx = () => {
    if (!previewUrl || previewFormat !== "docx") return;
    const link = window.document.createElement("a");
    link.href = previewUrl;
    link.download = "vista-previa.docx";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Revisar y descargar
        </h2>
        <p className="text-sm text-muted-foreground">
          {isGenerated
            ? "El documento ya fue generado. Puedes descargarlo en .docx o .pdf."
            : "Vista previa fiel del documento real (no consume número correlativo)."}
        </p>
      </header>

      {!isGenerated && (
        <ActiveTemplateBadge
          documentType={documentType}
          variant="prominent"
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Preview pane */}
        <div className="min-w-0">
          {isGenerated ? (
            storedDoc?.file_pdf_url ? (
              <PdfViewer
                documentId={documentId}
                pdfUrl={storedDoc.file_pdf_url}
                className="rounded-md border"
              />
            ) : (
              <div className="rounded-md border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                La conversión a PDF no está disponible en este servidor.
                Descarga el .docx desde el botón de la derecha — se ve
                idéntico al PDF al abrirlo en Word.
              </div>
            )
          ) : (
            <PreviewPane
              loading={preview.isPending && !previewUrl}
              refreshing={preview.isPending && Boolean(previewUrl)}
              url={previewUrl}
              format={previewFormat}
              onDownloadDocx={handleDownloadPreviewDocx}
            />
          )}
        </div>

        {/* Action rail */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium">Acciones</h3>
            {!isGenerated ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={refreshPreview}
                  disabled={preview.isPending || !documentId}
                >
                  {preview.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 h-4 w-4" />
                  )}
                  Actualizar vista previa
                </Button>

                <p className="text-xs text-muted-foreground">
                  Cuando estés conforme, &ldquo;Generar&rdquo; asigna el
                  número correlativo definitivo y guarda el archivo Word.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generate.isPending || !documentId}
                >
                  {generate.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : null}
                  Generar documento
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={back}
                  disabled={generate.isPending}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Atrás
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 p-3">
                  <FileCheck2 className="h-4 w-4 mt-0.5 text-primary" />
                  <p className="text-xs">
                    <span className="block font-medium">
                      {storedDoc?.number}
                    </span>
                    <span className="text-muted-foreground">
                      {storedDoc?.file_pdf_url
                        ? "Disponible en .docx y .pdf"
                        : "Disponible en .docx"}
                    </span>
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleDownload("docx")}
                  disabled={downloading === "docx"}
                >
                  {downloading === "docx" ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-4 w-4" />
                  )}
                  Descargar .docx
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleDownload("pdf")}
                  disabled={
                    !storedDoc?.file_pdf_url || downloading === "pdf"
                  }
                  title={
                    storedDoc?.file_pdf_url
                      ? undefined
                      : "El PDF se genera con LibreOffice; instálalo o actívalo en producción."
                  }
                >
                  {downloading === "pdf" ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-4 w-4" />
                  )}
                  Descargar .pdf
                </Button>
                <div className="border-t pt-3 space-y-2">
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/dashboard/documents">
                      <FileText className="mr-1 h-4 w-4" />
                      Ver mis documentos
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      reset();
                      if (typeof window !== "undefined") {
                        window.location.href = "/dashboard/documents/new";
                      }
                    }}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Crear otro
                  </Button>
                </div>
              </>
            )}
          </div>

          {isFreePlan && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-xs space-y-2">
              <p className="font-medium">Plan gratuito</p>
              <p className="text-muted-foreground">
                Los documentos incluyen marca de agua. Pasa al plan Pro para
                eliminar la marca y obtener documentos ilimitados.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/dashboard/billing">Ver planes</Link>
              </Button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Preview pane — handles loading / pdf-iframe / docx-fallback states
// ---------------------------------------------------------------------------

function PreviewPane({
  loading,
  refreshing,
  url,
  format,
  onDownloadDocx,
}: {
  loading: boolean;
  refreshing: boolean;
  url: string | null;
  format: "pdf" | "docx" | null;
  onDownloadDocx: () => void;
}) {
  // Mobile browsers (iOS Safari, Chrome Android) don't render PDFs
  // inside iframes — the embedded `application/pdf` doesn't trigger
  // their native viewer, so the iframe shows blank or tries to
  // download the file. We swap the inline viewer for an "open in new
  // tab" CTA on mobile, where the OS viewer takes over.
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex h-[640px] items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Generando vista previa…
      </div>
    );
  }

  if (!url) {
    return (
      <div className="rounded-md border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Aún no hay vista previa. Usa &ldquo;Actualizar vista
        previa&rdquo; para renderizar el documento con los datos actuales.
      </div>
    );
  }

  if (format === "docx") {
    // LibreOffice no estaba disponible → no podemos mostrar inline,
    // ofrecemos la descarga del .docx como mejor alternativa.
    return (
      <div className="rounded-md border bg-card p-6 text-sm space-y-3">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-primary" />
          <div className="space-y-1">
            <p className="font-medium">
              Vista previa disponible como .docx
            </p>
            <p className="text-muted-foreground">
              El servidor no tiene LibreOffice instalado para convertir
              a PDF inline. Descarga el .docx para verlo en Word — es
              idéntico al que se generará al darle &ldquo;Generar&rdquo;.
            </p>
          </div>
        </div>
        <Button onClick={onDownloadDocx} variant="outline">
          <Download className="mr-1 h-4 w-4" />
          Descargar vista previa (.docx)
        </Button>
      </div>
    );
  }

  // Mobile: open the blob URL in a new tab so the device's native PDF
  // viewer (iOS Files / Android PDF viewer) renders it. Embedding
  // inline doesn't work — WebKit/Blink mobile don't honor PDF iframes.
  if (isMobile) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm space-y-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-primary" />
          <div className="space-y-1">
            <p className="font-medium">Vista previa lista</p>
            <p className="text-muted-foreground">
              Los navegadores móviles no muestran PDFs embebidos. Tocá
              para abrirlo en una pestaña nueva con el visor de tu
              dispositivo.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-4 w-4" />
              Abrir vista previa
            </a>
          </Button>
          <Button onClick={onDownloadDocx} variant="outline" className="flex-1">
            <Download className="mr-1 h-4 w-4" />
            Descargar .docx
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: inline iframe (Chrome / Firefox / Edge have built-in
  // PDF viewers that handle blob: URLs without trouble).
  return (
    <div className="relative">
      {refreshing && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 rounded-t-md bg-primary/10 px-3 py-1.5 text-xs text-primary">
          <Loader2 className="h-3 w-3 animate-spin" />
          Actualizando…
        </div>
      )}
      <iframe
        src={url}
        title="Vista previa del documento"
        className="w-full rounded-md border"
        style={{ minHeight: 720, border: 0 }}
      />
      <div className="mt-2 flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Abrir en pestaña nueva
          </a>
        </Button>
      </div>
    </div>
  );
}
