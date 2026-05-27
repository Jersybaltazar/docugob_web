"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORIES,
  documentTypesByCategory,
  type DocumentTypeSpec,
} from "@/lib/document-types";
import type { DocumentType } from "@/lib/api/types";

import { useWizard } from "./wizard-context";
import { ActiveTemplateBadge } from "./active-template-badge";

/**
 * Wizard Step 1 — pick the document type (Sprint 8 — Fase 2).
 *
 * Renders 30 templates grouped into 6 categories. A top-level search
 * filters across every category by label or description, hiding
 * empty categories until the query is cleared.
 *
 * `comingSoon` types are rendered grayed-out with a badge and can't
 * be selected — the backend doesn't have their templates yet.
 */
export function StepType() {
  const { documentType, setDocumentType, next } = useWizard();
  const [query, setQuery] = useState("");
  // Categories the user has explicitly toggled. We start empty so the
  // page opens compact; the user picks the category they want and
  // only that one expands. Active search overrides this — see below.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const grouped = useMemo(() => documentTypesByCategory(), []);
  const queryNorm = query.trim().toLowerCase();
  const isSearching = queryNorm.length > 0;

  const filtered = useMemo(() => {
    if (!queryNorm) return grouped;
    const out: Record<string, DocumentTypeSpec[]> = {};
    for (const [cat, specs] of Object.entries(grouped)) {
      const matched = specs.filter(
        (s) =>
          s.label.toLowerCase().includes(queryNorm) ||
          s.description.toLowerCase().includes(queryNorm) ||
          s.recommendedFor.toLowerCase().includes(queryNorm)
      );
      if (matched.length > 0) out[cat] = matched;
    }
    return out;
  }, [grouped, queryNorm]);

  const handleSelect = (spec: DocumentTypeSpec) => {
    if (spec.comingSoon) return;
    setDocumentType(spec.code as DocumentType);
  };

  const toggleCategory = (code: string) => {
    setExpanded((prev) => {
      const out = new Set(prev);
      if (out.has(code)) out.delete(code);
      else out.add(code);
      return out;
    });
  };

  const totalVisible = Object.values(filtered).reduce(
    (n, list) => n + list.length,
    0
  );
  const totalAll = Object.values(grouped).flat().length;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          ¿Qué tipo de documento crearás?
        </h2>
        <p className="text-sm text-muted-foreground">
          {totalAll} plantillas conformes a la Ley N° 27444, organizadas
          por uso. Toca una categoría para ver sus plantillas.
        </p>
      </header>

      {/* Search */}
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

      {totalVisible === 0 && (
        <div className="rounded-lg border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
          No se encontraron plantillas para
          <span className="font-medium text-foreground">
            {" "}
            “{query}”
          </span>
          . Prueba con otra palabra.
        </div>
      )}

      {/* Category accordions */}
      <div role="radiogroup" aria-label="Tipo de documento" className="space-y-2">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const specs = filtered[cat.code];
          if (!specs || specs.length === 0) return null;
          const CategoryIcon = cat.icon;
          // While searching, force every matching category open so
          // results are visible without extra clicks.
          const isOpen = isSearching || expanded.has(cat.code);
          // Highlight the category that contains the currently-selected type.
          const containsSelected = specs.some((s) => s.code === documentType);

          return (
            <div
              key={cat.code}
              className={cn(
                "rounded-lg border bg-card transition-colors",
                containsSelected && "border-primary/40 bg-primary/[0.03]"
              )}
            >
              <button
                type="button"
                onClick={() => !isSearching && toggleCategory(cat.code)}
                aria-expanded={isOpen}
                aria-controls={`cat-${cat.code}`}
                disabled={isSearching}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                  !isSearching && "hover:bg-muted/40",
                  isSearching && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    isOpen || containsSelected
                      ? "bg-primary/15 text-primary"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <CategoryIcon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {specs.length} {specs.length === 1 ? "plantilla" : "plantillas"}
                    {containsSelected && " · 1 seleccionada"}
                  </p>
                </div>
                {!isSearching && (
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                )}
              </button>

              {isOpen && (
                <div
                  id={`cat-${cat.code}`}
                  className="grid gap-3 border-t bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {specs.map((doc) => (
                    <TypeCard
                      key={doc.code}
                      spec={doc}
                      selected={documentType === doc.code}
                      onSelect={() => handleSelect(doc)}
                      onDoubleSelect={() => {
                        if (doc.comingSoon) return;
                        handleSelect(doc);
                        next();
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* When a type is selected, surface which template will be used
          so the user knows whether their custom upload is in effect. */}
      {documentType && <ActiveTemplateBadge documentType={documentType} />}

      <footer className="flex items-center justify-between gap-2 pt-2">
        <p className="text-xs text-muted-foreground">
          {isSearching
            ? `${totalVisible} de ${totalAll} plantillas coinciden con “${query}”`
            : `${totalAll} plantillas disponibles`}
        </p>
        <Button type="button" size="lg" onClick={next} disabled={!documentType}>
          Continuar
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function TypeCard({
  spec,
  selected,
  onSelect,
  onDoubleSelect,
}: {
  spec: DocumentTypeSpec;
  selected: boolean;
  onSelect: () => void;
  onDoubleSelect: () => void;
}) {
  const Icon = spec.icon;
  const disabled = spec.comingSoon === true;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      onDoubleClick={onDoubleSelect}
      className={cn(
        "group flex h-full flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all",
        !disabled && "hover:border-primary/40 hover:bg-muted/40",
        selected &&
          !disabled &&
          "border-primary ring-2 ring-primary/20 bg-primary/5 hover:bg-primary/5",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
            selected && !disabled
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {disabled && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Sparkles className="h-2.5 w-2.5" />
            Próximamente
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <h4 className="font-medium leading-tight">{spec.label}</h4>
        <p className="text-xs text-muted-foreground line-clamp-3">
          {spec.description}
        </p>
      </div>
      <p className="mt-auto pt-2 text-[11px] text-muted-foreground italic">
        {spec.recommendedFor}
      </p>
    </button>
  );
}
