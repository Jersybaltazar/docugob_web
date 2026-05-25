"use client";

/**
 * DocuGob — Document hooks.
 *
 * One query per concern so the cache keys stay small and predictable.
 * Mutations invalidate the relevant list/detail keys explicitly.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  documentsApi,
  type CreateDocumentBody,
  type GenerateDocumentBody,
  type ListDocumentsParams,
  type UpdateDocumentBody,
} from "@/lib/api/documents";

export const documentsKeys = {
  all: ["documents"] as const,
  list: (params: ListDocumentsParams) =>
    ["documents", "list", params] as const,
  detail: (id: string) => ["documents", "detail", id] as const,
};

export function useDocuments(params: ListDocumentsParams = {}) {
  return useQuery({
    queryKey: documentsKeys.list(params),
    queryFn: () => documentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useDocument(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? documentsKeys.detail(id) : ["documents", "detail", "noop"],
    queryFn: () => documentsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDocumentBody) => documentsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useUpdateDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateDocumentBody) => documentsApi.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(documentsKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useGenerateDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateDocumentBody = {}) =>
      documentsApi.generate(id, body),
    onSuccess: (data) => {
      qc.setQueryData(documentsKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

/**
 * Dry-run preview — backend renders without assigning a correlative
 * or persisting anything. Used by the wizard's "Vista previa fiel"
 * step. Exposed as a mutation (not a query) because:
 *  - It's a POST with a body that mirrors the generate flow.
 *  - The user controls when to re-render via an explicit button.
 *  - Caching a binary blob isn't worth the complexity.
 */
export function usePreviewDocument(id: string) {
  return useMutation({
    mutationFn: (body: GenerateDocumentBody = {}) =>
      documentsApi.preview(id, body),
  });
}
