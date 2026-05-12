"use client";

/**
 * DocuGob — Inline AI validation panel.
 *
 * Surfaces the post-generation validation produced by the backend:
 *  - `missing_fields`: literal `[FALTA: ...]` markers the AI inserted
 *     in lieu of data it didn't have.
 *  - `suspect_markers`: regex hits that *might* indicate fabricated
 *     facts (TDR §5.2 anti-hallucination).
 *  - `has_closing_formula`: whether the body honored the formal
 *    closing fórmula expected for this document type.
 *  - `word_count`: bare counter to help the user assess length.
 *
 * The panel is intentionally non-blocking — it informs, not gates.
 */

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIValidationReport } from "@/lib/api/types";

export function AIValidationPanel({
  validation,
  className,
}: {
  validation: AIValidationReport | null | undefined;
  className?: string;
}) {
  if (!validation) return null;

  const hasMissing = validation.missing_fields.length > 0;
  const hasSuspect = validation.suspect_markers.length > 0;
  const ok = validation.is_clean;

  return (
    <aside
      className={cn(
        "space-y-3 rounded-lg border p-4",
        ok ? "border-primary/30 bg-primary/5" : "border-amber-300/60 bg-amber-50",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <header className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )}
        <h4 className="text-sm font-medium">
          {ok ? "Borrador listo para revisar" : "Revisa antes de continuar"}
        </h4>
      </header>

      {hasMissing && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-900">
            Datos faltantes detectados ({validation.missing_fields.length})
          </p>
          <ul className="space-y-1 text-xs text-amber-900/80">
            {validation.missing_fields.map((field) => (
              <li
                key={field}
                className="flex items-start gap-1.5 rounded bg-amber-100/60 px-2 py-1 font-mono"
              >
                <span className="select-none opacity-70">[FALTA:</span>
                <span>{field}</span>
                <span className="select-none opacity-70">]</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-amber-900/80">
            Reemplaza estos marcadores con la información real antes de
            generar el documento final.
          </p>
        </div>
      )}

      {hasSuspect && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-900">
            Posibles inventos del modelo ({validation.suspect_markers.length})
          </p>
          <ul className="space-y-1 text-xs text-amber-900/80">
            {validation.suspect_markers.slice(0, 4).map((m) => (
              <li key={m} className="rounded bg-amber-100/60 px-2 py-1 font-mono">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
        <span>
          {validation.word_count} palabra
          {validation.word_count === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span className="flex items-center gap-1">
          {validation.has_closing_formula ? (
            <CheckCircle2 className="h-3 w-3 text-primary" />
          ) : (
            <Info className="h-3 w-3 text-muted-foreground" />
          )}
          {validation.has_closing_formula
            ? "Fórmula de cierre presente"
            : "Sin fórmula de cierre detectada"}
        </span>
      </div>
    </aside>
  );
}
