"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { WIZARD_STEPS, useWizard, type WizardStep } from "./wizard-context";

/**
 * 4-step horizontal indicator. Steps already completed are clickable
 * (jump-back). Future steps are gated until prerequisites are met.
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
      <ol className="flex w-full items-center gap-2 sm:gap-4">
        {WIZARD_STEPS.map(({ step: target, label, helper }, idx) => {
          const isActive = step === target;
          const isDone = step > target;
          const unlocked = isUnlocked(target);

          return (
            <li key={target} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => unlocked && goToStep(target)}
                disabled={!unlocked}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "group flex flex-1 items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors",
                  isActive && "border-primary ring-2 ring-primary/20",
                  isDone && "border-primary/40",
                  !unlocked && "opacity-50 cursor-not-allowed",
                  unlocked && !isActive && "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : target}
                </span>
                <span className="flex flex-col leading-tight min-w-0">
                  <span className="text-sm font-medium truncate">{label}</span>
                  <span className="hidden sm:inline truncate text-xs text-muted-foreground">
                    {helper}
                  </span>
                </span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "hidden sm:block h-px flex-1 bg-border",
                    step > target && "bg-primary/30"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
