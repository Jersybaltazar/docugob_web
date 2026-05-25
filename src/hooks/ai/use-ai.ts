"use client";

/**
 * DocuGob — AI hooks.
 *
 * Thin TanStack Query wrappers around `aiApi`. We don't cache the
 * mutations themselves (each call is contextual) but we DO invalidate
 * the related document detail when an AI draft persists into a record.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  aiApi,
  type DraftBodyParams,
  type DraftForDocumentParams,
  type RefineParams,
  type SuggestTitleParams,
} from "@/lib/api/ai";
import { documentsKeys } from "@/hooks/documents/use-documents";

export function useDraftBody() {
  return useMutation({
    mutationFn: (params: DraftBodyParams) => aiApi.draftBody(params),
  });
}

export function useDraftForDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: DraftForDocumentParams) =>
      aiApi.draftForDocument(params),
    onSuccess: (_data, variables) => {
      if (variables.persist !== false) {
        qc.invalidateQueries({
          queryKey: documentsKeys.detail(variables.document_id),
        });
      }
    },
  });
}

export function useRefineAI() {
  return useMutation({
    mutationFn: (params: RefineParams) => aiApi.refine(params),
  });
}

export function useSuggestTitle() {
  return useMutation({
    mutationFn: (params: SuggestTitleParams) => aiApi.suggestTitle(params),
  });
}
