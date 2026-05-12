"use client";

/**
 * DocuGob — Wizard Step 3: Asistente IA.
 *
 * TDR §7.1 — atajos visuales para acciones críticas. Surfaces:
 *   • "Generar con IA" / "Regenerar"   → POST /ai/documents/{id}/draft
 *   • Quick refinements                 → POST /ai/refine
 *       — "Hacer más formal"
 *       — "Hacer más conciso"
 *       — "Tono institucional"
 *       — "Más detallado"
 *   • Custom refinement instruction (open text)
 *   • TipTap rich-text editor where the user fine-tunes the result
 *   • AIValidationPanel + AIUsageBar for transparency
 *
 * The editor stays the source of truth — whatever lives in it when
 * the user clicks "Continuar" goes to Step 4 / generate.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { AIValidationPanel } from "@/components/ai/ai-validation-panel";
import { AIUsageBar } from "@/components/ai/ai-usage-bar";
import { ApiError } from "@/lib/api/client";
import { useDraftForDocument, useRefineAI } from "@/hooks/use-ai";
import { htmlToText, textToHtml } from "@/lib/rich-text";
import { useWizard } from "./wizard-context";
import type { AIDraftResponse } from "@/lib/api/types";

const QUICK_REFINEMENTS: { label: string; instruction: string }[] = [
  { label: "Más formal", instruction: "Hazlo más formal y protocolar." },
  { label: "Más conciso", instruction: "Hazlo más conciso, máximo 150 palabras." },
  {
    label: "Tono institucional",
    instruction:
      "Eleva el tono institucional, manteniendo el contenido sustantivo.",
  },
  {
    label: "Más detallado",
    instruction: "Amplía el contenido con un nivel de detalle mayor.",
  },
];

export function StepAI() {
  const {
    documentId,
    documentType,
    title,
    contentData,
    aiGeneratedBody,
    setAIGeneratedBody,
    setDocument,
    back,
    next,
  } = useWizard();

  // The editor holds HTML; we hydrate from the plain-text body stored
  // in wizard state. The conversion is intentionally one-shot on mount
  // and on every AI response — typing in the editor doesn't re-hydrate.
  const [editorHtml, setEditorHtml] = useState<string>(() =>
    aiGeneratedBody ? textToHtml(aiGeneratedBody) : ""
  );
  const [antecedentes, setAntecedentes] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");

  const [lastResponse, setLastResponse] = useState<AIDraftResponse | null>(null);

  const draft = useDraftForDocument();
  const refine = useRefineAI();
  const busy = draft.isPending || refine.isPending;

  // Whenever Step 2 changes the body upstream (e.g. user came back and
  // re-saved Step 2), pull that into the editor.
  useEffect(() => {
    if (!editorHtml && aiGeneratedBody) {
      setEditorHtml(textToHtml(aiGeneratedBody));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiGeneratedBody]);

  const hasBody = Boolean(editorHtml && editorHtml.replace(/<[^>]+>/g, "").trim());

  const fieldsSnapshot = useMemo(() => {
    if (!contentData) return [];
    const fields = [
      ["Asunto", contentData.asunto],
      ["Destinatario", contentData.destinatario_nombre],
      ["Cargo", contentData.destinatario_cargo],
      ["Entidad", contentData.destinatario_entidad],
      ["Referencia", contentData.referencia],
    ] as const;
    return fields
      .filter(([, v]) => v && String(v).trim())
      .map(([label, v]) => ({ label, value: String(v) }));
  }, [contentData]);

  const applyResponse = (resp: AIDraftResponse) => {
    setLastResponse(resp);
    const plain = resp.text ?? "";
    setEditorHtml(textToHtml(plain));
    setAIGeneratedBody(plain);
  };

  const handleGenerate = async () => {
    if (!documentId) {
      toast.error("Primero guarda el borrador en el paso 2");
      return;
    }
    try {
      const resp = await draft.mutateAsync({
        document_id: documentId,
        antecedentes,
        persist: true,
      });
      applyResponse(resp);
      // The endpoint persisted ai_generated_body on the document, so
      // pull the fresh doc into the wizard state for Step 4's summary.
      // We don't need the actual fetch — the document detail will be
      // refetched by the invalidation in the hook.
      if (resp.usage.cached) {
        toast.success("Redacción recuperada de caché (sin costo)");
      } else {
        toast.success("Redacción generada por IA");
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo generar el cuerpo";
      toast.error(message);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!instruction.trim()) return;
    const currentBody = htmlToText(editorHtml);
    if (!currentBody.trim() || currentBody.length < 10) {
      toast.error("Primero redacta o genera un cuerpo para poder refinarlo");
      return;
    }
    try {
      const resp = await refine.mutateAsync({
        current_body: currentBody,
        instruction: instruction.trim(),
      });
      applyResponse(resp);
      toast.success("Refinamiento aplicado");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo refinar el cuerpo";
      toast.error(message);
    }
  };

  const handleContinue = () => {
    // Commit the latest editor content back to the wizard before moving on.
    setAIGeneratedBody(htmlToText(editorHtml));
    next();
  };

  const handleEditorChange = (html: string) => {
    setEditorHtml(html);
    // Stash the plain-text version eagerly so Step 4's summary always
    // mirrors what the user sees, without forcing them to leave the step.
    setAIGeneratedBody(htmlToText(html));
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Asistente IA
        </h2>
        <p className="text-sm text-muted-foreground">
          Redacta el cuerpo del documento con ayuda del asistente. Puedes
          editarlo libremente o pedirle ajustes con los atajos.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 min-w-0">
          {/* Generation controls */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="antecedentes" className="text-sm font-medium">
                Contexto adicional para la IA{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="antecedentes"
                rows={3}
                value={antecedentes}
                onChange={(e) => setAntecedentes(e.target.value)}
                placeholder="Ej: 'Necesitamos consolidar indicadores antes del 31 de mayo. DIRESA debe enviar datos del IV trimestre.' Cuanto más específico, mejor el resultado."
                maxLength={2000}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={busy || !documentId}
                size="default"
              >
                {draft.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                {hasBody ? "Regenerar con IA" : "Generar con IA"}
              </Button>
              {hasBody && (
                <span className="text-xs text-muted-foreground">
                  Atención: reemplazará el contenido actual del editor.
                </span>
              )}
            </div>
          </div>

          {/* Editor */}
          <TiptapEditor
            value={editorHtml}
            onChange={handleEditorChange}
            editable={!busy}
            placeholder="Aún no hay cuerpo. Pulsa 'Generar con IA' o redacta directamente aquí."
          />

          {/* Quick refinement actions */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wand2 className="h-4 w-4 text-primary" />
              Ajustes rápidos
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_REFINEMENTS.map((action) => (
                <Button
                  key={action.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefine(action.instruction)}
                  disabled={busy || !hasBody}
                >
                  {refine.isPending && refine.variables?.instruction === action.instruction ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  {action.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Instrucción personalizada: ej. 'Cita la Ley 27444 al final'"
                maxLength={200}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInstruction.trim()) {
                    e.preventDefault();
                    handleRefine(customInstruction);
                    setCustomInstruction("");
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  handleRefine(customInstruction);
                  setCustomInstruction("");
                }}
                disabled={busy || !hasBody || !customInstruction.trim()}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>

        {/* Side rail: snapshot + validation + telemetry */}
        <aside className="space-y-4 min-w-0">
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-medium">Resumen del documento</h3>
            <p className="text-xs text-muted-foreground">
              Tipo: {documentType ?? "—"}
              <br />
              Título: {title || "—"}
            </p>
            {fieldsSnapshot.length > 0 && (
              <dl className="mt-2 space-y-1.5 text-xs">
                {fieldsSnapshot.map((f) => (
                  <div key={f.label}>
                    <dt className="text-muted-foreground">{f.label}</dt>
                    <dd className="line-clamp-2">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <AIValidationPanel validation={lastResponse?.validation ?? null} />

          {lastResponse?.usage && (
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <h4 className="text-xs font-medium">Telemetría de la IA</h4>
              <AIUsageBar usage={lastResponse.usage} />
            </div>
          )}
        </aside>
      </div>

      <footer className="flex items-center justify-between gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={back} disabled={busy}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Atrás
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleContinue}
          disabled={busy || !hasBody}
        >
          Continuar a la vista previa
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </section>
  );
}
