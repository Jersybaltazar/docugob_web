/**
 * DocuGob — Templates API.
 *
 * Read-only catalog of system + tenant templates. The `fields_schema`
 * on each Template will be consumed by Sprint 4's dynamic form
 * generator.
 */

import { api } from "./client";
import type { DocumentType, TemplateListItem, TemplateRead } from "./types";

export const templatesApi = {
  list(document_type?: DocumentType): Promise<TemplateListItem[]> {
    const qs = document_type ? `?document_type=${document_type}` : "";
    return api.get<TemplateListItem[]>(`/templates${qs}`);
  },
  /**
   * Detail of one template, including `fields_schema`. Used by the
   * dynamic form generator in Step 2 of the wizard.
   */
  get(id: string): Promise<TemplateRead> {
    return api.get<TemplateRead>(`/templates/${id}`);
  },
};
