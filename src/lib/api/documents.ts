/**
 * DocuGob — Documents API.
 *
 * Mirrors the FastAPI `/documents` endpoints. The `download()` helper
 * uses a different code path than the rest because it streams binary
 * content; everything else goes through the JSON envelope.
 */

import { api } from "./client";
import { API_V1 } from "./config";
import { tokenStorage } from "@/lib/auth/storage";
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
   * We don't go through the envelope wrapper because the body is binary.
   */
  async download(id: string, format: "docx" | "pdf"): Promise<Blob> {
    const token = tokenStorage.getAccess();
    const res = await fetch(`${API_V1}/documents/${id}/download/${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }
    return res.blob();
  },
};
