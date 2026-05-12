"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import type { DocumentType } from "@/lib/api/types";
import { ChevronRight } from "lucide-react";
import { useWizard } from "./wizard-context";

/**
 * Wizard Step 1 — pick the document type.
 *
 * 8 cards (4×2 on desktop, 1-col on mobile) following the Word-like
 * familiarity principle from TDR §7.1. Selecting a card is instant;
 * "Continuar" advances to Step 2. We don't auto-advance on click
 * because users sometimes want to read the descriptions of multiple
 * cards before committing.
 */
export function StepType() {
  const { documentType, setDocumentType, next } = useWizard();

  const handleSelect = (code: DocumentType) => {
    setDocumentType(code);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          ¿Qué tipo de documento crearás?
        </h2>
        <p className="text-sm text-muted-foreground">
          Las 8 plantillas siguen los formatos oficiales de la Ley N° 27444.
        </p>
      </header>

      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        role="radiogroup"
        aria-label="Tipo de documento"
      >
        {DOCUMENT_TYPES.map((doc) => {
          const Icon = doc.icon;
          const selected = documentType === doc.code;
          return (
            <button
              key={doc.code}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(doc.code)}
              onDoubleClick={() => {
                handleSelect(doc.code);
                next();
              }}
              className={cn(
                "group flex h-full flex-col items-start gap-3 rounded-lg border bg-card p-4 text-left transition-all",
                "hover:border-primary/40 hover:bg-muted/40",
                selected &&
                  "border-primary ring-2 ring-primary/20 bg-primary/5 hover:bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h3 className="font-medium leading-tight">{doc.label}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {doc.description}
                </p>
              </div>
              <p className="mt-auto pt-2 text-[11px] text-muted-foreground italic">
                {doc.recommendedFor}
              </p>
            </button>
          );
        })}
      </div>

      <footer className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          size="lg"
          onClick={next}
          disabled={!documentType}
        >
          Continuar
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </section>
  );
}
