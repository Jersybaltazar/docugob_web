/**
 * DocuGob — AI API surface.
 *
 * Mirrors the FastAPI `/ai/*` endpoints from Sprint 3 backend:
 *   POST /ai/draft-body
 *   POST /ai/refine
 *   POST /ai/suggest-title
 *   POST /ai/documents/{id}/draft
 */

import { api } from "./client";
import type { AIDraftResponse, DocumentType } from "./types";

export type DraftBodyParams = {
  document_type: DocumentType;
  title: string;
  content_data: Record<string, unknown>;
  antecedentes?: string;
};

export type DraftForDocumentParams = {
  document_id: string;
  antecedentes?: string;
  content_data?: Record<string, unknown>;
  persist?: boolean;
};

export type RefineParams = {
  current_body: string;
  instruction: string;
};

export type SuggestTitleParams = {
  asunto: string;
  document_type: DocumentType;
};

export const aiApi = {
  draftBody(params: DraftBodyParams): Promise<AIDraftResponse> {
    return api.post<AIDraftResponse>("/ai/draft-body", {
      document_type: params.document_type,
      title: params.title,
      content_data: params.content_data,
      antecedentes: params.antecedentes ?? "",
    });
  },

  draftForDocument(params: DraftForDocumentParams): Promise<AIDraftResponse> {
    const { document_id, ...body } = params;
    return api.post<AIDraftResponse>(`/ai/documents/${document_id}/draft`, {
      antecedentes: body.antecedentes ?? "",
      content_data: body.content_data,
      persist: body.persist ?? true,
    });
  },

  refine(params: RefineParams): Promise<AIDraftResponse> {
    return api.post<AIDraftResponse>("/ai/refine", params);
  },

  suggestTitle(params: SuggestTitleParams): Promise<AIDraftResponse> {
    return api.post<AIDraftResponse>("/ai/suggest-title", params);
  },
};
