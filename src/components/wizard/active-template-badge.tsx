"use client";

/**
 * DocuGob — "Active template" indicator.
 *
 * Renders a compact banner that tells the user which `.docx` template
 * is going to be used for the selected document type. Three visual
 * states:
 *
 *   - Loading  → skeleton bar (while `useTemplateForType` resolves).
 *   - Tenant   → green tick + "Usando tu plantilla personalizada: <name>".
 *   - System   → muted info icon + "Usando plantilla del sistema" + CTA
 *                to upload a custom one.
 *
 * Goal: remove the ambiguity that the wizard had — users couldn't
 * tell which template the backend would pick when generating. See
 * `useTemplateForType` for the resolution priority.
 */

import Link from "next/link";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTemplateForType } from "@/hooks/templates/use-templates";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/lib/api/types";

type Props = {
  documentType: DocumentType | null | undefined;
  /** Visual variant — `compact` is for step 1; `prominent` for preview. */
  variant?: "compact" | "prominent";
  className?: string;
};

export function ActiveTemplateBadge({
  documentType,
  variant = "compact",
  className,
}: Props) {
  const { data: template, isLoading } = useTemplateForType(documentType);

  if (!documentType) return null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Detectando plantilla activa…
      </div>
    );
  }

  if (!template) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive",
          className
        )}
      >
        <FileText className="h-4 w-4" />
        Esta plantilla todavía no está disponible. Subí tu propia versión
        para empezar a usar el tipo.
      </div>
    );
  }

  const isCustom = !template.is_system;
  const prominent = variant === "prominent";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        isCustom
          ? "border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "bg-muted/30 text-muted-foreground",
        prominent && "px-5 py-4",
        className
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2">
        {isCustom ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
        ) : (
          <FileText className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div className="min-w-0">
          <p className={cn("truncate", prominent && "font-medium")}>
            {isCustom ? (
              <>
                Usando tu plantilla personalizada:{" "}
                <span className="font-semibold">{template.name}</span>
              </>
            ) : (
              <>
                Usando plantilla del sistema —{" "}
                <span className="font-medium">{template.name}</span>
              </>
            )}
          </p>
          {!isCustom && (
            <p className="mt-0.5 text-xs">
              Subí tu propio .docx con tu membrete y pie de página para
              personalizarlo.
            </p>
          )}
        </div>
      </div>

      <Button asChild size="sm" variant={isCustom ? "outline" : "default"}>
        <Link href="/dashboard/settings/templates">
          {isCustom ? "Cambiar" : "Subir mi plantilla"}
        </Link>
      </Button>
    </div>
  );
}
