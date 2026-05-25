"use client";

import { useQuery } from "@tanstack/react-query";
import { templatesApi } from "@/lib/api/templates";
import type { DocumentType, TemplateRead } from "@/lib/api/types";

export const templatesKeys = {
  all: ["templates"] as const,
  list: (document_type?: DocumentType) =>
    ["templates", "list", document_type ?? "all"] as const,
  detail: (id: string) => ["templates", "detail", id] as const,
  forType: (document_type: DocumentType) =>
    ["templates", "forType", document_type] as const,
};

export function useTemplates(document_type?: DocumentType) {
  return useQuery({
    queryKey: templatesKeys.list(document_type),
    queryFn: () => templatesApi.list(document_type),
    staleTime: 5 * 60_000, // templates rarely change
  });
}

export function useTemplate(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? templatesKeys.detail(id) : ["templates", "detail", "noop"],
    queryFn: () => templatesApi.get(id as string),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

/**
 * Resolve the active Template that the backend would pick for a given
 * document_type. Mirrors the backend's resolution priority:
 *   1. Active TENANT template       (uploaded via Settings → Mis plantillas)
 *   2. Active SYSTEM template       (DocuGob's default)
 *   3. Any inactive template        (last resort, defensive)
 *
 * The wizard uses this to know which `fields_schema` to render and
 * which "this document will be generated with…" indicator to show.
 */
export function useTemplateForType(
  document_type: DocumentType | null | undefined
) {
  return useQuery<TemplateRead | null>({
    queryKey: document_type
      ? templatesKeys.forType(document_type)
      : ["templates", "forType", "noop"],
    queryFn: async () => {
      if (!document_type) return null;
      const list = await templatesApi.list(document_type);

      const tenantActive = list.find(
        (t) => !t.is_system && t.is_active
      );
      const systemActive = list.find(
        (t) => t.is_system && t.is_active
      );
      const candidate =
        tenantActive ?? systemActive ?? list.find(Boolean) ?? null;
      if (!candidate) return null;
      return await templatesApi.get(candidate.id);
    },
    enabled: Boolean(document_type),
    staleTime: 5 * 60_000,
  });
}
