"use client";

/**
 * DocuGob — /dashboard/templates
 *
 * Read-only catalog of templates available to the current tenant
 * (system templates + tenant-owned, when Sprint 8 adds custom upload).
 *
 * Each card surfaces the doc type icon + name + description and a CTA
 * that deep-links into the wizard preselected with that type.
 */

import Link from "next/link";
import { useTemplates } from "@/hooks/templates/use-templates";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_BY_CODE } from "@/lib/document-types";
import type { DocumentType } from "@/lib/api/types";
import { Plus } from "lucide-react";

export default function TemplatesPage() {
  const { data: templates, isLoading, isError } = useTemplates();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Plantillas disponibles
        </h1>
        <p className="text-sm text-muted-foreground">
          Estas son las plantillas oficiales que DocuGob trae preconfiguradas.
          La carga de plantillas propias estará disponible para el plan
          Institucional próximamente.
        </p>
      </header>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No se pudieron cargar las plantillas. Intenta de nuevo en unos
          segundos.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))
          : (templates ?? []).map((tpl) => {
              const spec = DOCUMENT_TYPE_BY_CODE[tpl.document_type as DocumentType];
              const Icon = spec?.icon;
              return (
                <article
                  key={tpl.id}
                  className="flex flex-col rounded-lg border bg-card p-5"
                >
                  <header className="flex items-start gap-3">
                    {Icon && (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium leading-tight truncate">
                        {spec?.label ?? tpl.document_type}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        v{tpl.version}{" "}
                        {tpl.is_system && (
                          <Badge variant="secondary" className="ml-1">
                            Oficial
                          </Badge>
                        )}
                      </p>
                    </div>
                  </header>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground line-clamp-3">
                    {tpl.description ?? spec?.description ?? ""}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-4 self-start">
                    <Link
                      href={`/dashboard/documents/new?type=${tpl.document_type}`}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Usar esta plantilla
                    </Link>
                  </Button>
                </article>
              );
            })}
      </div>
    </div>
  );
}
