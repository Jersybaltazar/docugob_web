"use client";

/**
 * DocuGob — Tenant-uploaded template hooks.
 *
 * Three mutations + one query, each with the project-standard toast
 * feedback (AUDIT §8.bis.2.1):
 *   - Éxito:   { title: "Éxito", description }
 *   - Error:   { title: "Error", description, variant: "destructive" }
 *
 * The catalog query the wizard uses (`templates.list`) is
 * invalidated on every mutation because the resolution order on the
 * backend (tenant > system) means uploading or deleting a tenant
 * template changes which `Template` row the wizard renders for that
 * document_type.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { tenantTemplatesApi } from "@/lib/api/tenant-templates";
import { templatesKeys } from "@/hooks/templates/use-templates";
import type {
  DocumentType,
  TemplateListItem,
} from "@/lib/api/types";

export const tenantTemplatesKeys = {
  mine: ["tenant-templates", "mine"] as const,
};

export function useMyTenantTemplates() {
  return useQuery<TemplateListItem[]>({
    queryKey: tenantTemplatesKeys.mine,
    queryFn: () => tenantTemplatesApi.listMine(),
    staleTime: 60_000,
  });
}

export function useUploadTenantTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      document_type: DocumentType;
      name: string;
      description?: string;
      file: File;
    }) => tenantTemplatesApi.upload(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantTemplatesKeys.mine });
      qc.invalidateQueries({ queryKey: templatesKeys.all });
      toast({
        title: "Éxito",
        description: "Plantilla subida correctamente",
      });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "No se pudo subir la plantilla";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}

export function useDeleteTenantTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantTemplatesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantTemplatesKeys.mine });
      qc.invalidateQueries({ queryKey: templatesKeys.all });
      toast({
        title: "Éxito",
        description:
          "Plantilla eliminada. Volverá a usarse la plantilla del sistema.",
      });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo eliminar la plantilla";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });
}

/**
 * Trigger a browser download for the tenant's original .docx. Lives
 * outside React Query because it's a one-shot side effect that
 * doesn't have any cache representation.
 */
export async function downloadTenantTemplate(
  id: string,
  filename: string
): Promise<void> {
  try {
    const blob = await tenantTemplatesApi.download(id);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "No se pudo descargar la plantilla";
    toast({ title: "Error", description: message, variant: "destructive" });
  }
}
