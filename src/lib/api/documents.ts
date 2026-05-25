/**
 * DocuGob — Documents API.
 *
 * Mirrors the FastAPI `/documents` endpoints. The `download()` helper
 * uses a different code path than the rest because it streams binary
 * content; everything else goes through the JSON envelope.
 */

import { api } from "./client";
import { API_V1 } from "./config";
import type {
  DocumentListItem,
  DocumentRead,
  DocumentStatus,
  DocumentType,
  PaginatedResponse,
} from "./types";

export type ListDocumentsParams = {
  page?: number;
  page_size?: number;
  document_type?: DocumentType;
  status?: DocumentStatus;
  search?: string;
};

export type CreateDocumentBody = {
  document_type: DocumentType;
  title: string;
  content_data?: Record<string, unknown>;
  area_id?: string;
};

export type UpdateDocumentBody = {
  title?: string;
  content_data?: Record<string, unknown>;
  ai_generated_body?: string;
  status?: DocumentStatus;
};

export type GenerateDocumentBody = {
  content_data?: Record<string, unknown>;
  ai_generated_body?: string;
  area_id?: string;
  generate_pdf?: boolean;
};

export const documentsApi = {
  list(params: ListDocumentsParams = {}): Promise<PaginatedResponse<DocumentListItem>> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    if (params.document_type) query.set("document_type", params.document_type);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    const qs = query.toString();
    return api.get<PaginatedResponse<DocumentListItem>>(
      `/documents${qs ? `?${qs}` : ""}`
    );
  },

  get(id: string): Promise<DocumentRead> {
    return api.get<DocumentRead>(`/documents/${id}`);
  },

  create(body: CreateDocumentBody): Promise<DocumentRead> {
    return api.post<DocumentRead>("/documents", body);
  },

  update(id: string, body: UpdateDocumentBody): Promise<DocumentRead> {
    return api.patch<DocumentRead>(`/documents/${id}`, body);
  },

  delete(id: string): Promise<unknown> {
    return api.delete(`/documents/${id}`);
  },

  generate(id: string, body: GenerateDocumentBody = {}): Promise<DocumentRead> {
    return api.post<DocumentRead>(`/documents/${id}/generate`, body);
  },

  /**
   * Download the .docx or .pdf as a Blob ready for `URL.createObjectURL`.
   * Goes through the Next.js proxy at `/api/*`; the HttpOnly cookie is
   * attached automatically and the proxy injects the bearer token.
   */
  async download(id: string, format: "docx" | "pdf"): Promise<Blob> {
    const res = await fetch(
      `${API_V1}/documents/${id}/download/${format}`,
      { credentials: "same-origin" }
    );
    if (!res.ok) {
      throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }
    return res.blob();
  },

  /**
   * Dry-run preview — backend renders the document with overrides but
   * does NOT assign a correlative or persist anything. Returns the
   * blob + the format ("pdf" or "docx") so the caller can show the PDF
   * inline or surface a download CTA when LibreOffice is unavailable.
   */
  async preview(
    id: string,
    body: GenerateDocumentBody = {}
  ): Promise<{ blob: Blob; format: "pdf" | "docx" }> {
    const res = await fetch(`${API_V1}/documents/${id}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    if (!res.ok) {
      // Try to surface the envelope's message when present
      try {
        const payload = await res.json();
        throw new Error(payload?.message ?? `HTTP ${res.status}`);
      } catch (jsonErr) {
        if (jsonErr instanceof Error && jsonErr.message.startsWith("HTTP")) {
          throw jsonErr;
        }
        throw new Error(`Preview failed: ${res.status} ${res.statusText}`);
      }
    }
    // Prefer the explicit `X-Preview-Format` header but fall back to
    // sniffing the Content-Type — protects against the proxy or a
    // load balancer stripping custom headers.
    const explicit = res.headers.get("x-preview-format");
    const contentType = res.headers.get("content-type") ?? "";
    const looksLikeDocx =
      contentType.includes("wordprocessingml") ||
      contentType.includes("officedocument");
    const format: "pdf" | "docx" =
      explicit === "docx" || (!explicit && looksLikeDocx) ? "docx" : "pdf";
    return { blob: await res.blob(), format };
  },
};
