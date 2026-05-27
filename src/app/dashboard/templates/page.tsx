"use client";

/**
 * DocuGob — /dashboard/templates
 *
 * Read-only catalog of the templates available to the current tenant.
 * Mirrors the step-type UX of the wizard: categories are collapsed by
 * default to avoid the long scroll, expand on click, and auto-expand
 * the categories that match the active search query.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Search } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPE_BY_CODE,
  documentTypesByCategory,
  type DocumentTypeSpec,
} from "@/lib/document-types";
import type { DocumentType } from "@/lib/api/types";
import { useTemplates } from "@/hooks/templates/use-templates";

export default function TemplatesPage() {
  const { data: templates, isLoading, isError } = useTemplates();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const queryNorm = query.trim().toLowerCase();
  const isSearching = queryNorm.length > 0;

  // Templates returned by the API are keyed by document_type. Group
  // them into categories using the same source of truth as the wizard.
  const byCategory = useMemo(() => documentTypesByCategory(), []);

  // Build a quick lookup from document_type → server-returned template
  // so we can show name/version metadata from the backend (priority to
  // tenant-owned over system once Sprint 8 lands at runtime).
  const tplByType = useMemo(() => {
    const map = new Map<string, ReturnType<typeof Object> & {
      id: string;
      version: number;
      description: string | null;
      is_system: boolean;
    }>();
    for (const t of templates ?? []) {
      // The server returns the tenant-priority template only — see
      // `template_repository.resolve_for_document`. If two rows exist
      // we keep the first (the tenant-owned one).
      if (!map.has(t.document_type)) {
        map.set(t.document_type, t as unknown as never);
      }
    }
    return map;
  }, [templates]);

  const filteredByCategory = useMemo<Record<string, DocumentTypeSpec[]>>(() => {
    if (!queryNorm) return byCategory as Record<string, DocumentTypeSpec[]>;
    const out: Record<string, DocumentTypeSpec[]> = {};
    for (const [cat, specs] of Object.entries(byCategory)) {
      const matched = specs.filter(
        (s) =>
          s.label.toLowerCase().includes(queryNorm) ||
          s.description.toLowerCase().includes(queryNorm) ||
          s.recommendedFor.toLowerCase().includes(queryNorm),
      );
      if (matched.length > 0) out[cat] = matched;
    }
    return out;
  }, [byCategory, queryNorm]);

  const toggleCategory = (code: string) => {
    setExpanded((prev) => {
      const out = new Set(prev);
      if (out.has(code)) out.delete(code);
      else out.add(code);
      return out;
    });
  };

  const totalVisible = Object.values(filteredByCategory).reduce(
    (n, list) => n + list.length,
    0,
  );
  const totalAll = Object.values(byCategory).flat().length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Plantillas disponibles
        </h1>
        <p className="text-sm text-muted-foreground">
          {totalAll} plantillas oficiales conformes a la Ley N° 27444,
          organizadas por uso. Toca una categoría para ver sus plantillas.
        </p>
      </header>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No se pudieron cargar las plantillas. Intenta de nuevo en unos
          segundos.
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, descripción o uso..."
          className="pl-9"
          aria-label="Buscar tipo de documento"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : totalVisible === 0 ? (
        <div className="rounded-lg border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
          {isSearching ? (
            <>
              No se encontraron plantillas para{" "}
              <span className="font-medium text-foreground">“{query}”</span>.
            </>
          ) : (
            <>No hay plantillas disponibles todavía.</>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const specs = filteredByCategory[cat.code];
            if (!specs || specs.length === 0) return null;
            const CategoryIcon = cat.icon;
            const isOpen = isSearching || expanded.has(cat.code);
            return (
              <div
                key={cat.code}
                className="rounded-lg border bg-card transition-colors"
              >
                <button
                  type="button"
                  onClick={() => !isSearching && toggleCategory(cat.code)}
                  aria-expanded={isOpen}
                  aria-controls={`tpl-cat-${cat.code}`}
                  disabled={isSearching}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                    !isSearching && "hover:bg-muted/40",
                    isSearching && "cursor-default",
                  )}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CategoryIcon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold tracking-tight">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {specs.length}{" "}
                      {specs.length === 1 ? "plantilla" : "plantillas"}
                    </p>
                  </div>
                  {!isSearching && (
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  )}
                </button>

                {isOpen && (
                  <div
                    id={`tpl-cat-${cat.code}`}
                    className="grid gap-3 border-t bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {specs.map((spec) => {
                      const Icon = spec.icon;
                      const serverTpl = tplByType.get(spec.code);
                      return (
                        <article
                          key={spec.code}
                          className="flex flex-col rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
                        >
                          <header className="flex items-start gap-3">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="truncate text-sm font-medium leading-tight">
                                {spec.label}
                              </h4>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {serverTpl
                                  ? `v${serverTpl.version}`
                                  : DOCUMENT_TYPE_BY_CODE[
                                      spec.code as DocumentType
                                    ]
                                  ? "v1"
                                  : "—"}{" "}
                                {serverTpl &&
                                  (serverTpl.is_system ? (
                                    <Badge
                                      variant="secondary"
                                      className="ml-1 text-[9px]"
                                    >
                                      Oficial
                                    </Badge>
                                  ) : (
                                    <Badge className="ml-1 bg-emerald-50 text-[9px] text-emerald-700 hover:bg-emerald-50">
                                      Tuya
                                    </Badge>
                                  ))}
                              </p>
                            </div>
                          </header>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {spec.description}
                          </p>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mt-3 self-start"
                          >
                            <Link
                              href={`/dashboard/documents/new?type=${spec.code}`}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Usar esta plantilla
                            </Link>
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <footer className="pt-2 text-xs text-muted-foreground">
        {isSearching
          ? `${totalVisible} de ${totalAll} plantillas coinciden con “${query}”`
          : `${totalAll} plantillas oficiales · personalízalas en `}
        {!isSearching && (
          <Link
            href="/dashboard/settings/templates"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Mis plantillas
          </Link>
        )}
      </footer>
    </div>
  );
}
