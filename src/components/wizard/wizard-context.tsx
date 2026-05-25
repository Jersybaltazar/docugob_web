"use client";

/**
 * DocuGob — Wizard state container.
 *
 * Holds the cross-step state of the document creation wizard:
 *  - selected document_type
 *  - title + content_data being built
 *  - the document_id once Step 2 commits the draft to the backend
 *  - the AI-generated body once Step 3 lands (Sprint 3 frontend)
 *
 * Steps:
 *   1 = Tipo · 2 = Datos básicos · 3 = Asistente IA · 4 = Vista previa
 *
 * We persist the current draft id in the URL (`?id=`) so users can
 * refresh the wizard or share the link with themselves and resume.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useDocument } from "@/hooks/documents/use-documents";
import type { DocumentRead, DocumentType } from "@/lib/api/types";

export type WizardStep = 1 | 2 | 3 | 4;

export const WIZARD_STEPS: { step: WizardStep; label: string; helper: string }[] = [
  { step: 1, label: "Tipo", helper: "Elige qué tipo de documento crearás" },
  { step: 2, label: "Datos básicos", helper: "Destinatario, asunto y cuerpo" },
  { step: 3, label: "Asistente IA", helper: "Redacta el cuerpo con ayuda de IA" },
  { step: 4, label: "Vista previa", helper: "Revisa, genera y descarga" },
];

export type WizardState = {
  documentType: DocumentType | null;
  title: string;
  contentData: Record<string, unknown>;
  aiGeneratedBody: string;
  documentId: string | null;
  /** Backend Document after Step 2 commit (or Step 4 generate). */
  document: DocumentRead | null;
};

const INITIAL_STATE: WizardState = {
  documentType: null,
  title: "",
  contentData: {},
  aiGeneratedBody: "",
  documentId: null,
  document: null,
};

type WizardContextValue = WizardState & {
  step: WizardStep;
  goToStep: (step: WizardStep) => void;
  next: () => void;
  back: () => void;
  setDocumentType: (code: DocumentType) => void;
  setTitle: (title: string) => void;
  patchContent: (patch: Record<string, unknown>) => void;
  setAIGeneratedBody: (text: string) => void;
  setDocument: (doc: DocumentRead) => void;
  reset: () => void;
};

const WizardCtx = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Bootstrap from URL ?type=<doc_type> and ?id=<draft_id> when present.
  const initialType = searchParams.get("type") as DocumentType | null;
  const initialId = searchParams.get("id");

  const [state, setState] = useState<WizardState>({
    ...INITIAL_STATE,
    documentType: initialType,
    documentId: initialId,
  });
  // Start on Step 2 if we already have an id (continuing a draft) or
  // a preselected type (deep-link from sidebar / command palette).
  const [step, setStep] = useState<WizardStep>(() => {
    if (initialId) return 2;
    if (initialType) return 2;
    return 1;
  });

  // When we land on `?id=<draft>` (e.g. user clicked a row in
  // "Mis documentos") the only thing the URL gives us is the id. We
  // still need to know the `document_type`, `title`, `content_data`
  // and `ai_generated_body` so the wizard can render step 2's form
  // and resolve the active template. Fetch the draft and hydrate the
  // state once.
  const { data: existingDocument } = useDocument(initialId);

  // Adjust-state-during-render hydration. Two guards make it safe:
  //   1. `state.documentType === null` — only hydrate when the wizard
  //      hasn't been populated yet (initial draft load). The user's
  //      mutations after this point set documentType, so subsequent
  //      renders skip this branch.
  //   2. The fetched doc's id matches the URL id we asked for — protects
  //      against a stale cache delivering a different document.
  if (
    existingDocument &&
    state.documentType === null &&
    existingDocument.id === initialId
  ) {
    setState((s) => ({
      ...s,
      document: existingDocument,
      documentId: existingDocument.id,
      documentType: existingDocument.document_type as DocumentType,
      title: existingDocument.title || s.title,
      contentData:
        (existingDocument.content_data as Record<string, unknown>) ??
        s.contentData,
      aiGeneratedBody: existingDocument.ai_generated_body ?? s.aiGeneratedBody,
    }));
  }

  const goToStep = useCallback((next: WizardStep) => {
    setStep(next);
    // Scroll to top on step change so the user always lands on the
    // step header. The wizard fits in one viewport but on small
    // screens this avoids a confusing mid-page jump.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const next = useCallback(() => {
    setStep((s) => (s < 4 ? ((s + 1) as WizardStep) : s));
  }, []);
  const back = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s));
  }, []);

  const setDocumentType = useCallback((code: DocumentType) => {
    setState((s) => ({ ...s, documentType: code }));
  }, []);
  const setTitle = useCallback((title: string) => {
    setState((s) => ({ ...s, title }));
  }, []);
  const patchContent = useCallback((patch: Record<string, unknown>) => {
    setState((s) => ({ ...s, contentData: { ...s.contentData, ...patch } }));
  }, []);
  const setAIGeneratedBody = useCallback((text: string) => {
    setState((s) => ({ ...s, aiGeneratedBody: text }));
  }, []);
  const setDocument = useCallback((doc: DocumentRead) => {
    setState((s) => ({
      ...s,
      document: doc,
      documentId: doc.id,
      title: doc.title || s.title,
      contentData: (doc.content_data as Record<string, unknown>) ?? s.contentData,
      aiGeneratedBody: doc.ai_generated_body ?? s.aiGeneratedBody,
      documentType: (doc.document_type as DocumentType) ?? s.documentType,
    }));
  }, []);
  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setStep(1);
  }, []);

  // Keep `?id=` in sync with state.documentId so refreshes work.
  useEffect(() => {
    const current = searchParams.get("id");
    if (state.documentId && state.documentId !== current) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", state.documentId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.documentId]);

  const value = useMemo<WizardContextValue>(
    () => ({
      ...state,
      step,
      goToStep,
      next,
      back,
      setDocumentType,
      setTitle,
      patchContent,
      setAIGeneratedBody,
      setDocument,
      reset,
    }),
    [
      state,
      step,
      goToStep,
      next,
      back,
      setDocumentType,
      setTitle,
      patchContent,
      setAIGeneratedBody,
      setDocument,
      reset,
    ]
  );

  return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardCtx);
  if (!ctx) {
    throw new Error("useWizard must be used inside a WizardProvider");
  }
  return ctx;
}
