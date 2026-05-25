"use client";

/**
 * DocuGob — /dashboard/documents/[id]
 *
 * Detail view for a single document. Differs from the wizard in that:
 *  - it's read-mostly (no step navigation),
 *  - it offers download/delete shortcuts depending on status,
 *  - it embeds the generated PDF when available, with the HTML
 *    preview as a graceful fallback.
 *
 * For drafts, the page deep-links into the wizard's `?id=` flow so
 * the user can resume editing.
 */

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { DocumentPreview } from "@/components/preview/document-preview";
import { PdfViewer } from "@/components/preview/pdf-viewer";
import { useDocument, useDeleteDocument } from "@/hooks/documents/use-documents";
import { useCurrentUser } from "@/hooks/auth/use-auth";
import { documentsApi } from "@/lib/api/documents";
import { ApiError } from "@/lib/api/client";
import { DOCUMENT_TYPE_BY_CODE } from "@/lib/document-types";
import { format } from "@/lib/format";
import type { DocumentType } from "@/lib/api/types";

export default function DocumentDetailPage({
  params,
}: {
  // Next 16 hands route params as a Promise — unwrap with React.use().
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: doc, isLoading, isError, error } = useDocument(id);
  const { data: user } = useCurrentUser();

  const deleteDoc = useDeleteDocument();
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);

  const handleDownload = async (format_: "docx" | "pdf") => {
    setDownloading(format_);
    try {
      const blob = await documentsApi.download(id, format_);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      const safeNumber = doc?.number?.replace(/[\s/]/g, "-") ?? id;
      link.download = `${safeNumber}.${format_}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `No se pudo descargar el ${format_}`;
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc.mutateAsync(id);
      toast({ title: "Éxito", description: "Documento eliminado" });
      router.push("/dashboard/documents");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo eliminar";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/documents">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error instanceof ApiError && error.status === 404
            ? "Este documento no existe o no tienes acceso."
            : "No se pudo cargar el documento. Intenta de nuevo."}
        </div>
      </div>
    );
  }

  const spec = DOCUMENT_TYPE_BY_CODE[doc.document_type as DocumentType];
  const Icon = spec?.icon;
  const isDraft = doc.status === "draft";
  const isGenerated = !isDraft;
  const isFreePlan =
    (user?.current_tenant?.plan ?? "").toLowerCase() === "free";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/documents">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a mis documentos
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {spec?.label ?? doc.document_type}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight truncate">
              {doc.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {doc.number ? `${doc.number} · ` : "Sin número (borrador) · "}
              actualizado {format.dateTime(doc.updated_at)}
            </p>
          </div>
        </div>
        <DocumentStatusBadge status={doc.status} />
      </header>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Preview */}
        <div className="min-w-0">
          {isGenerated && doc.file_pdf_url ? (
            <PdfViewer
              documentId={id}
              pdfUrl={doc.file_pdf_url}
              className="rounded-md border"
            />
          ) : (
            <DocumentPreview
              documentType={doc.document_type as DocumentType}
              title={doc.title}
              number={doc.number}
              entityName={user?.current_tenant?.name ?? "Tu entidad"}
              city="Huánuco"
              content={(doc.content_data ?? {}) as Record<string, unknown>}
              body={
                doc.ai_generated_body ||
                String(
                  (doc.content_data as Record<string, unknown> | null)?.cuerpo ?? ""
                )
              }
              watermark={isFreePlan ? "DocuGob" : ""}
            />
          )}
        </div>

        {/* Side rail */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-sm font-medium">Acciones</h3>

            {isDraft ? (
              <Button asChild className="w-full">
                <Link href={`/dashboard/documents/new?id=${id}`}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Continuar editando
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  className="w-full"
                  onClick={() => handleDownload("docx")}
                  disabled={!doc.file_docx_url || downloading === "docx"}
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
                  disabled={!doc.file_pdf_url || downloading === "pdf"}
                  title={
                    doc.file_pdf_url
                      ? undefined
                      : "PDF no disponible; el servidor no tiene LibreOffice instalado."
                  }
                >
                  {downloading === "pdf" ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-4 w-4" />
                  )}
                  Descargar .pdf
                </Button>
              </>
            )}

            {isDraft && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                    <Trash2 className="mr-1 h-4 w-4" />
                    Eliminar borrador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Eliminar borrador</DialogTitle>
                    <DialogDescription>
                      Esta acción no se puede deshacer. El borrador y los datos
                      capturados se perderán definitivamente.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        // Close the dialog by simulating its escape.
                        const button = e.currentTarget;
                        button.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
                        );
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteDoc.isPending}
                    >
                      {deleteDoc.isPending && (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      )}
                      Eliminar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-2 text-xs">
            <h3 className="text-sm font-medium">Metadatos</h3>
            <dl className="space-y-1.5">
              <Metadata label="Tipo" value={spec?.label ?? doc.document_type} />
              <Metadata label="Estado" value={doc.status} />
              <Metadata
                label="Número"
                value={doc.number ?? "(asignado al generar)"}
              />
              <Metadata label="Creado" value={format.dateTime(doc.created_at)} />
              <Metadata
                label="Actualizado"
                value={format.dateTime(doc.updated_at)}
              />
              {doc.metadata_extra && (
                <>
                  {typeof doc.metadata_extra.template_version === "number" && (
                    <Metadata
                      label="Plantilla"
                      value={`v${doc.metadata_extra.template_version}`}
                    />
                  )}
                  {typeof doc.metadata_extra.generated_at === "string" && (
                    <Metadata
                      label="Generado"
                      value={format.dateTime(
                        doc.metadata_extra.generated_at as string
                      )}
                    />
                  )}
                </>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right truncate max-w-[60%]" title={value}>
        {value}
      </dd>
    </div>
  );
}
