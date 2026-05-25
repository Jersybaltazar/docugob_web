/**
 * DocuGob — Tenant-uploaded template management.
 *
 * Sprint 8 — Fase 2 (replaced the previous branding-by-images
 * approach). Tenants upload their full `.docx` with their own
 * letterhead and footer already designed in Word; the system only
 * fills the body via Jinja2 tags. See `lib/template-tags.ts` for
 * the available placeholders.
 *
 * Backend contract (4 endpoints under /api/v1/templates):
 *
 *   GET    /templates/tenant/mine                  → TemplateListItem[]
 *   POST   /templates/tenant/upload                 → TemplateRead
 *     multipart/form-data:
 *       file: .docx (≤10 MB)
 *       document_type: DocumentType code
 *       name: string
 *       description: string?
 *   GET    /templates/tenant/{id}/download          → binary .docx
 *   DELETE /templates/tenant/{id}                   → unknown
 */

import { api } from "./client";
import { API_V1 } from "./config";
import type { DocumentType, TemplateListItem, TemplateRead } from "./types";

export const tenantTemplatesApi = {
  listMine(): Promise<TemplateListItem[]> {
    return api.get<TemplateListItem[]>("/templates/tenant/mine");
  },

  /**
   * Multipart upload. Returns the freshly-created `Template` row.
   * The fetch wrapper isn't used directly because the body is a
   * FormData, not JSON, and we need to skip `Content-Type` injection.
   */
  async upload(params: {
    document_type: DocumentType;
    name: string;
    description?: string;
    file: File;
  }): Promise<TemplateRead> {
    const body = new FormData();
    body.append("document_type", params.document_type);
    body.append("name", params.name);
    if (params.description) body.append("description", params.description);
    body.append("file", params.file);

    const res = await fetch(`${API_V1}/templates/tenant/upload`, {
      method: "POST",
      body,
      credentials: "same-origin",
    });

    type Envelope = {
      success: boolean;
      message: string;
      data: TemplateRead | null;
      errors: string[] | null;
    };
    let payload: Envelope | null = null;
    try {
      payload = (await res.json()) as Envelope;
    } catch {
      // Non-JSON response
    }

    if (!res.ok || !payload?.success || !payload.data) {
      const message =
        payload?.message ??
        payload?.errors?.[0] ??
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(message);
    }
    return payload.data;
  },

  /**
   * Download the .docx the tenant uploaded. Returns a Blob ready for
   * `URL.createObjectURL`. Same pattern as `documentsApi.download`.
   */
  async download(id: string): Promise<Blob> {
    const res = await fetch(
      `${API_V1}/templates/tenant/${id}/download`,
      { credentials: "same-origin" }
    );
    if (!res.ok) {
      throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }
    return res.blob();
  },

  delete(id: string): Promise<unknown> {
    return api.delete(`/templates/tenant/${id}`);
  },
};
