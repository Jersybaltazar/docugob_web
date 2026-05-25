/**
 * DocuGob — TypeScript shapes mirroring the FastAPI schemas.
 *
 * These are kept in sync manually for the MVP. Sprint 9 will generate
 * them from the OpenAPI spec via `openapi-typescript` so we never drift.
 */

// ----- Auth -----

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type TenantBrief = {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "institutional" | string;
  is_active: boolean;
};


export type UserWithTenant = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  current_tenant: TenantBrief | null;
  current_role: string | null;
};

// ----- Documents -----

/**
 * 30 document types organized in 6 categories. The 8 originals from
 * Sprint 4 (Hito 1 MVP) keep their codes; Sprint 8 added the rest.
 * Stays in sync with the backend enum — adding a new code here that
 * the backend doesn't know about results in 404s from the templates
 * service, so flip `comingSoon` in `document-types.ts` to gate the UI
 * until the backend ships the template.
 */
export type DocumentType =
  // Comunicaciones
  | "oficio_simple"
  | "oficio_multiple"
  | "oficio_circular"
  | "carta"
  | "carta_notarial"
  | "nota_envio"
  | "esquela"
  // Internos
  | "memorando"
  | "memorando_multiple"
  | "memorando_circular"
  | "proveido"
  | "hoja_ruta"
  // Informes
  | "informe_ordinario"
  | "informe_tecnico"
  | "informe_legal"
  | "informe_final"
  | "informe_auditoria"
  // Resoluciones
  | "resolucion_directoral"
  | "resolucion_jefatural"
  | "resolucion_administrativa"
  | "directiva"
  | "disposicion"
  // Solicitudes
  | "solicitud_general"
  | "solicitud_informacion"
  | "solicitud_vacaciones"
  | "solicitud_licencia"
  // Actas y Constancias
  | "acta_reunion"
  | "acta_conformidad"
  | "constancia"
  | "certificado";

export type DocumentCategory =
  | "comunicaciones"
  | "internos"
  | "informes"
  | "resoluciones"
  | "solicitudes"
  | "actas_constancias";

export type DocumentStatus =
  | "draft"
  | "generated"
  | "reviewed"
  | "signed"
  | "archived";

export type DocumentRead = {
  id: string;
  tenant_id: string;
  created_by: string | null;
  document_type: DocumentType;
  title: string;
  number: string | null;
  status: DocumentStatus;
  content_data: Record<string, unknown> | null;
  ai_generated_body: string | null;
  file_docx_url: string | null;
  file_pdf_url: string | null;
  metadata_extra: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type DocumentListItem = Pick<
  DocumentRead,
  | "id"
  | "document_type"
  | "title"
  | "number"
  | "status"
  | "created_at"
  | "updated_at"
  | "file_docx_url"
  | "file_pdf_url"
>;

// ----- Templates -----

export type TemplateListItem = {
  id: string;
  document_type: DocumentType;
  name: string;
  description: string | null;
  version: number;
  is_active: boolean;
  is_system: boolean;
};

/**
 * Full template payload returned by GET /templates/{id}, including the
 * `fields_schema` that the dynamic form generator consumes.
 *
 * The shape of `fields_schema` is JSON Schema (subset). The leaves are
 * typed loosely on purpose — `form-schema.ts` normalizes them into a
 * strongly-typed `FieldSpec[]` before rendering.
 */
export type TemplateRead = TemplateListItem & {
  tenant_id: string | null;
  file_url: string | null;
  fields_schema: TemplateFieldsSchema | null;
  created_at: string;
  updated_at: string;
};

export type TemplateFieldsSchema = {
  type?: "object";
  required?: string[];
  properties?: Record<string, TemplateFieldSchema>;
};

export type TemplateFieldSchema = {
  type?: "string" | "number" | "boolean" | "array" | "object";
  title?: string;
  description?: string;
  format?: string;
  maxLength?: number;
  minLength?: number;
  required?: string[];
  items?: TemplateFieldSchema;
  properties?: Record<string, TemplateFieldSchema>;
  minItems?: number;
};

// ----- AI -----

export type AIValidationReport = {
  missing_fields: string[];
  suspect_markers: string[];
  has_closing_formula: boolean;
  word_count: number;
  is_clean: boolean;
};

export type AIUsage = {
  provider: string;
  model: string;
  cached: boolean;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  latency_ms: number;
  estimated_cost_usd: number;
};

export type AIDraftResponse = {
  text: string;
  task_type: string;
  validation: AIValidationReport | null;
  usage: AIUsage;
};

// ----- Billing -----

export type PlanInfo = {
  code: "free" | "pro" | "institutional" | string;
  name: string;
  tagline: string;
  price_cents: number;
  price_decimal: string;
  currency: string;
  interval: string;
  features: string[];
  quotas: {
    max_documents_per_month: number;
    max_users: number;
    ai_requests_per_hour: number;
    watermark: boolean;
    custom_branding: boolean;
  };
};

export type PlanListResponse = {
  public_key: string;
  provider: string;
  plans: PlanInfo[];
};

export type SubscriptionRead = {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  payment_provider: string | null;
  external_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
};

// ----- Pagination -----

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};
