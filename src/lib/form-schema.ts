/**
 * DocuGob — Dynamic form schema normalizer.
 *
 * The backend's Template.fields_schema is a JSON Schema (subset). We
 * walk it once and convert it into a flat, strongly-typed `FieldSpec[]`
 * + a UI grouping. The wizard renders the result with a small switch
 * on `kind` — no `eval`, no generic JSON-Schema engine, no surprises.
 *
 * Supported kinds:
 *  - text       : single-line string
 *  - textarea   : multi-line string, including format=rich-text
 *  - array      : repeating group of object fields (e.g. destinatarios[])
 */

import type {
  TemplateFieldSchema,
  TemplateFieldsSchema,
} from "./api/types";

export type FieldKind = "text" | "textarea" | "array";

export type FieldSpec = {
  name: string;
  label: string;
  description?: string;
  kind: FieldKind;
  required: boolean;
  maxLength?: number;
  /** For arrays: the inner field specs that describe each item. */
  itemFields?: FieldSpec[];
  /** Minimum items for arrays (defaults to 1 when required). */
  minItems?: number;
};

export type FieldGroup = {
  /** Stable id for React keys. */
  id: string;
  label: string;
  hint?: string;
  fields: FieldSpec[];
};

/**
 * Group definitions. Each entry lists the fields it owns (in order).
 * Fields not declared anywhere fall into a trailing "Otros" group, so
 * a new field added on the backend never disappears from the UI.
 */
const GROUP_DEFINITIONS: Array<{
  id: string;
  label: string;
  hint?: string;
  members: string[];
}> = [
  {
    id: "destinatario",
    label: "Destinatario",
    members: [
      "destinatario_nombre",
      "destinatario_cargo",
      "destinatario_entidad",
      "destinatario_direccion",
    ],
  },
  {
    id: "destinatarios",
    label: "Destinatarios",
    hint: "Lista de personas a quienes va dirigido el documento.",
    members: ["destinatarios"],
  },
  {
    id: "interesado",
    label: "Interesado",
    hint: "Persona a quien se le entrega la constancia.",
    members: ["interesado_nombre", "interesado_dni"],
  },
  {
    id: "content",
    label: "Contenido",
    members: ["asunto", "referencia", "cuerpo"],
  },
  {
    id: "remitente",
    label: "Remitente",
    hint: "Quién firma el documento.",
    members: ["remitente_nombre", "remitente_cargo"],
  },
];

const TITLE_FALLBACKS: Record<string, string> = {
  destinatario_nombre: "Nombre del destinatario",
  destinatario_cargo: "Cargo del destinatario",
  destinatario_entidad: "Entidad del destinatario",
  destinatario_direccion: "Dirección",
  remitente_nombre: "Nombre del remitente",
  remitente_cargo: "Cargo del remitente",
  asunto: "Asunto",
  referencia: "Referencia",
  cuerpo: "Cuerpo del documento",
  area_id: "Siglas del área",
  interesado_nombre: "Nombre del interesado",
  interesado_dni: "DNI del interesado",
  nombre: "Nombre",
  cargo: "Cargo",
  entidad: "Entidad",
};

const PLACEHOLDER_HINTS: Record<string, string> = {
  destinatario_nombre: "Dr. Juan Pérez Vargas",
  destinatario_cargo: "Director General",
  destinatario_entidad: "DIRESA Huánuco",
  destinatario_direccion: "Av. Universitaria 123",
  asunto: "Solicitud de información sobre indicadores 2025",
  referencia: "Memorando N° 045-2026-DIRESA",
  remitente_nombre: "Dra. María García López",
  remitente_cargo: "Jefa de Unidad de Asesoría Jurídica",
  area_id: "UAJ, LOG, RRHH...",
  interesado_dni: "12345678",
};

/**
 * Decide whether a string field should render as a textarea.
 * Rules: explicit `format: rich-text`, the well-known `cuerpo` field,
 * or maxLength > 200.
 */
function inferStringKind(name: string, field: TemplateFieldSchema): FieldKind {
  if (field.format === "rich-text") return "textarea";
  if (name === "cuerpo") return "textarea";
  if (field.maxLength && field.maxLength > 200) return "textarea";
  return "text";
}

function buildFieldSpec(
  name: string,
  schema: TemplateFieldSchema,
  parentRequired: Set<string>
): FieldSpec | null {
  const required = parentRequired.has(name);
  const label = schema.title ?? TITLE_FALLBACKS[name] ?? humanize(name);
  const description = schema.description;

  if (schema.type === "array" && schema.items?.type === "object") {
    const itemRequired = new Set(schema.items.required ?? []);
    const itemFields = Object.entries(schema.items.properties ?? {})
      .map(([itemName, itemSchema]) =>
        buildFieldSpec(itemName, itemSchema, itemRequired)
      )
      .filter((f): f is FieldSpec => Boolean(f));
    if (itemFields.length === 0) return null;
    return {
      name,
      label,
      description,
      kind: "array",
      required,
      itemFields,
      minItems: schema.minItems ?? (required ? 1 : 0),
    };
  }

  // string / number / fallback — treat as text input
  if (!schema.type || schema.type === "string" || schema.type === "number") {
    return {
      name,
      label,
      description,
      kind: inferStringKind(name, schema),
      required,
      maxLength: schema.maxLength,
    };
  }

  // We don't render booleans or nested objects in the form yet — the
  // Sprint 4 schema doesn't include any.
  return null;
}

function humanize(name: string): string {
  return name
    .split(/[_\s]+/)
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
}

export function placeholderFor(name: string): string | undefined {
  return PLACEHOLDER_HINTS[name];
}

/**
 * Walk a Template.fields_schema and return:
 *  - `groups`: ordered groups with their fields (only the ones that
 *    exist in the schema and pass `buildFieldSpec`).
 *  - `requiredFields`: flat list of required field names — useful for
 *    runtime validation.
 *  - `allFields`: flat list of every FieldSpec, for tests / debug.
 */
export function normalizeFieldsSchema(
  schema: TemplateFieldsSchema | null | undefined
): { groups: FieldGroup[]; requiredFields: string[]; allFields: FieldSpec[] } {
  if (!schema || !schema.properties) {
    return { groups: [], requiredFields: [], allFields: [] };
  }
  const required = new Set(schema.required ?? []);
  const specs: Record<string, FieldSpec> = {};
  for (const [name, fieldSchema] of Object.entries(schema.properties)) {
    const spec = buildFieldSpec(name, fieldSchema, required);
    if (spec) specs[name] = spec;
  }

  const groups: FieldGroup[] = [];
  const placedNames = new Set<string>();

  for (const def of GROUP_DEFINITIONS) {
    const fields = def.members
      .map((m) => specs[m])
      .filter((s): s is FieldSpec => Boolean(s));
    if (fields.length === 0) continue;
    fields.forEach((f) => placedNames.add(f.name));
    groups.push({
      id: def.id,
      label: def.label,
      hint: def.hint,
      fields,
    });
  }

  // Catch-all for any field that wasn't grouped by name (excluding the
  // already-handled `title` and `area_id` we render in the "Básico" group
  // at the top of the form).
  const leftover = Object.values(specs).filter(
    (s) =>
      !placedNames.has(s.name) &&
      s.name !== "title" &&
      s.name !== "area_id"
  );
  if (leftover.length > 0) {
    groups.push({
      id: "otros",
      label: "Otros campos",
      fields: leftover,
    });
  }

  return {
    groups,
    requiredFields: Array.from(required),
    allFields: Object.values(specs),
  };
}
