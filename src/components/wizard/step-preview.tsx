"use client";

/**
 * DocuGob — Wizard Step 4: Faithful preview + Generate + Download.
 *
 * Pre-generation: shows a Word-like HTML approximation via
 * `<DocumentPreview />`. Post-generation: swaps to the inline PDF
 * (`<PdfViewer />`) when the backend converted the .docx via
 * LibreOffice; otherwise it keeps the HTML preview alongside a clear
 * note that PDF conversion is unavailable.
 *
 * The "Generar" button is a one-shot — once the document moves to
 * `generated` status, the action row reveals the download options.
 */

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  Download,
  FileCheck2,
  FileText,
  Loader2,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { documentsApi } from "@/lib/api/documents";
import { ApiError } from "@/lib/api/client";
import { useGenerateDocument } from "@/hooks/use-documents";
import { useCurrentUser } from "@/hooks/use-auth";
import { DocumentPreview } from "@/components/preview/document-preview";
import { PdfViewer } from "@/components/preview/pdf-viewer";
import { useWizard } from "./wizard-context";

export function StepPreview() {
  const {
    documentId,
    documentType,
    title,
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
  const isGenerated =
    storedDoc?.status === "generated" ||
    storedDoc?.status === "reviewed" ||
    storedDoc?.status === "signed";

  const isFreePlan =
    (user?.current_tenant?.plan ?? "").toLowerCase() === "free";

  const handleGenerate = async () => {
    if (!documentId) {
      toast.error("Primero guarda el borrador en el paso 2");
      return;
    }
    try {
      const doc = await generate.mutateAsync({
        content_data: contentData,
        ai_generated_body: aiGeneratedBody || undefined,
        generate_pdf: true,
      });
      setDocument(doc);
      toast.success(`Documento generado · ${doc.number ?? ""}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo generar el documento";
      toast.error(message);
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
        err instanceof Error ? err.message : `No se pudo descargar el ${format_}`;
      toast.error(message);
    } finally {
      setDownloading(null);
    }
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
            : "Revisa la vista previa fiel. Al generar, se asignará el número correlativo definitivo y se producirá el archivo Word."}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Preview pane */}
        <div className="min-w-0">
          {isGenerated && storedDoc?.file_pdf_url ? (
            <PdfViewer
              documentId={documentId}
              pdfUrl={storedDoc.file_pdf_url}
              className="rounded-md border"
            />
          ) : (
            <DocumentPreview
              documentType={documentType}
              title={title}
              number={storedDoc?.number}
              entityName={user?.current_tenant?.name ?? "Tu entidad"}
              city="Huánuco"
              content={contentData ?? {}}
              body={
                aiGeneratedBody ||
                String((contentData as Record<string, unknown>)?.cuerpo ?? "")
              }
              watermark={isFreePlan ? "DocuGob" : ""}
            />
          )}
        </div>

        {/* Action rail */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium">Acciones</h3>
            {!isGenerated ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Aún no has generado el documento. Al hacerlo se asignará el
                  número correlativo y se creará el archivo Word definitivo.
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
