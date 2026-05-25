"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { WIZARD_STEPS, useWizard, type WizardStep } from "./wizard-context";

/**
 * 4-step horizontal indicator with responsive layout:
 *   - mobile  → 2×2 grid (numbered chips + label only).
 *   - sm+     → 4-column grid, equal width, with the helper text.
 *
 * The previous implementation used flex + `flex-1` connectors that
 * stole horizontal space and pushed the 4th card off-screen on
 * laptop viewports. A grid removes the issue: every cell is exactly
 * 1/N of the row width, content truncates inside.
 */
export function WizardStepIndicator() {
  const { step, goToStep, documentType, documentId } = useWizard();

  const isUnlocked = (target: WizardStep): boolean => {
    if (target === 1) return true;
    if (target === 2) return Boolean(documentType);
    if (target === 3) return Boolean(documentId);
    if (target === 4) return Boolean(documentId);
    return false;
  };

  return (
    <nav aria-label="Progreso del asistente" className="w-full">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {WIZARD_STEPS.map(({ step: target, label, helper }) => {
          const isActive = step === target;
          const isDone = step > target;
          const unlocked = isUnlocked(target);

          return (
            <li key={target} className="min-w-0">
              <button
                type="button"
                onClick={() => unlocked && goToStep(target)}
                disabled={!unlocked}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "group flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors",
                  isActive && "border-primary ring-2 ring-primary/20",
                  isDone && "border-primary/40",
                  !unlocked && "opacity-50 cursor-not-allowed",
                  unlocked && !isActive && "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    (isDone || isActive)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : target}
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-medium">{label}</span>
                  <span className="hidden truncate text-xs text-muted-foreground lg:inline">
                    {helper}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
