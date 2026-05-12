"use client";

/**
 * DocuGob — /dashboard/documents
 *
 * Paginated list of the tenant's documents with filters + search.
 * Each row links to its detail (Sprint 3 will land the detail page).
 *
 * Empty state guides the user toward the wizard; the page also offers
 * a "Continuar" affordance for draft rows so users can re-enter the
 * wizard for a half-filled document.
 */

import Link from "next/link";
import { useState } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DocumentsToolbar,
  type DocumentsToolbarValue,
} from "@/components/documents/documents-toolbar";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { DOCUMENT_TYPE_BY_CODE } from "@/lib/document-types";
import type { DocumentListItem, DocumentType } from "@/lib/api/types";
import { Plus, FileX, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "@/lib/format";

export default function DocumentsListPage() {
  const [filters, setFilters] = useState<DocumentsToolbarValue>({
    search: "",
    document_type: "all",
    status: "all",
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError } = useDocuments({
    page,
    page_size: 20,
    search: filters.search || undefined,
    document_type:
      filters.document_type && filters.document_type !== "all"
        ? (filters.document_type as DocumentType)
        : undefined,
    status:
      filters.status && filters.status !== "all"
        ? (filters.status as DocumentListItem["status"])
        : undefined,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 0;

  const handleFilterChange = (next: DocumentsToolbarValue) => {
    setFilters(next);
    setPage(1); // reset pagination whenever filters change
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mis documentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0
              ? `${total} documento${total === 1 ? "" : "s"} en total`
              : "Aún no hay documentos generados"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/documents/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Crear documento
          </Link>
        </Button>
      </header>

      <DocumentsToolbar value={filters} onChange={handleFilterChange} />

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Ocurrió un error al cargar la lista. Intenta de nuevo en unos
          segundos.
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header row — desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <div className="col-span-5">Documento</div>
          <div className="col-span-3">Tipo</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2 text-right">Actualizado</div>
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <EmptyState hasFilters={Boolean(filters.search) || filters.document_type !== "all" || filters.status !== "all"} />
        ) : (
          items.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages}
            {isFetching && " · actualizando..."}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc }: { doc: DocumentListItem }) {
  const spec = DOCUMENT_TYPE_BY_CODE[doc.document_type];
  const Icon = spec?.icon;

  const continueOrView = doc.status === "draft" ? "Continuar" : "Ver";
  const href =
    doc.status === "draft"
      ? `/dashboard/documents/new?id=${doc.id}`
      : `/dashboard/documents/${doc.id}`;

  return (
    <Link
      href={href}
      className="grid grid-cols-1 md:grid-cols-12 gap-3 border-b last:border-b-0 px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <div className="col-span-5 flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{doc.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {doc.number ?? "Sin número (borrador)"}
          </p>
        </div>
      </div>

      <div className="col-span-3 text-sm text-muted-foreground md:self-center">
        {spec?.label ?? doc.document_type}
      </div>

      <div className="col-span-2 md:self-center">
        <DocumentStatusBadge status={doc.status} />
      </div>

      <div className="col-span-2 text-sm text-muted-foreground md:self-center md:text-right">
        <span className="md:hidden text-xs">{continueOrView} · </span>
        {format.dateShort(doc.updated_at)}
      </div>
    </Link>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3">
          <Skeleton className="col-span-5 h-9" />
          <Skeleton className="col-span-3 h-9" />
          <Skeleton className="col-span-2 h-9" />
          <Skeleton className="col-span-2 h-9" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileX className="h-6 w-6" />
      </div>
      <p className="font-medium">
        {hasFilters ? "Sin resultados" : "Aún no has creado documentos"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Ajusta los filtros o limpia la búsqueda."
          : "Crea tu primer oficio o memorando para empezar."}
      </p>
      {!hasFilters && (
        <Button asChild className="mt-4">
          <Link href="/dashboard/documents/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Crear documento
          </Link>
        </Button>
      )}
    </div>
  );
}
