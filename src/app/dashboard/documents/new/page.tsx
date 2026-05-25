"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import {
  WizardProvider,
  useWizard,
} from "@/components/wizard/wizard-context";
import { WizardStepIndicator } from "@/components/wizard/wizard-step-indicator";
import { StepType } from "@/components/wizard/step-type";
import { StepFields } from "@/components/wizard/step-fields";
import { StepAI } from "@/components/wizard/step-ai";
import { StepPreview } from "@/components/wizard/step-preview";

/**
 * /dashboard/documents/new
 *
 * The whole wizard lives here. We wrap it in Suspense because
 * `useSearchParams()` (used inside WizardProvider) requires a Suspense
 * boundary in Next 16's App Router.
 */
export default function NewDocumentPage() {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    </Suspense>
  );
}

function WizardShell() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/documents">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a mis documentos
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nuevo documento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El asistente te guía en cuatro pasos para producir un documento
          oficial listo para firmar.
        </p>
      </header>

      <WizardStepIndicator />

      <div className="pt-2">
        <CurrentStep />
      </div>
    </div>
  );
}

function CurrentStep() {
  const { step } = useWizard();
  switch (step) {
    case 1:
      return <StepType />;
    case 2:
      return <StepFields />;
    case 3:
      return <StepAI />;
    case 4:
      return <StepPreview />;
    default:
      return null;
  }
}

function WizardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="h-9" />
      <div className="h-12 rounded-lg bg-muted/40" />
      <div className="h-12 rounded-lg bg-muted/40" />
      <div className="h-64 rounded-lg bg-muted/40" />
    </div>
  );
}
