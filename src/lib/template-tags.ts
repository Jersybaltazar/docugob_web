/**
 * DocuGob — Available Jinja2 tags for tenant-uploaded templates.
 *
 * Mirrors the keys exposed by the backend's `_build_render_context`
 * in `document_generator_service`. Update this whenever the backend
 * adds or renames a placeholder so the docs panel in the UI stays
 * truthful.
 */

export type TemplateTag = {
  tag: string;
  description: string;
};

export type TemplateTagGroup = {
  id: string;
  label: string;
  tags: TemplateTag[];
};

export const TEMPLATE_TAG_GROUPS: TemplateTagGroup[] = [
  {
    id: "numeracion",
    label: "Numeración y fecha",
    tags: [
      { tag: "{{ numero }}", description: "Número correlativo asignado al documento" },
      { tag: "{{ numero_oficio }}", description: "Alias para numero (usado en oficios)" },
      { tag: "{{ fecha }}", description: "Fecha del documento (DD/MM/YYYY)" },
      {
        tag: "{{ lugar_fecha }}",
        description: 'Ciudad + fecha (ej: "Huánuco, 23 de mayo de 2026")',
      },
      { tag: "{{ ciudad }}", description: "Ciudad de emisión del documento" },
    ],
  },
  {
    id: "entidad",
    label: "Entidad emisora",
    tags: [
      { tag: "{{ entidad_nombre }}", description: "Nombre completo de la entidad" },
      { tag: "{{ entidad_ruc }}", description: "RUC de la entidad" },
      { tag: "{{ siglas_entidad }}", description: "Siglas o acrónimo institucional" },
    ],
  },
  {
    id: "destinatario",
    label: "Destinatario",
    tags: [
      {
        tag: "{{ destinatario_nombre }}",
        description: "Nombre completo del destinatario",
      },
      {
        tag: "{{ destinatario_cargo }}",
        description: "Cargo del destinatario",
      },
      {
        tag: "{{ destinatario_entidad }}",
        description: "Entidad u organización del destinatario",
      },
    ],
  },
  {
    id: "remitente",
    label: "Remitente / firmante",
    tags: [
      { tag: "{{ remitente_nombre }}", description: "Nombre del firmante" },
      { tag: "{{ remitente_cargo }}", description: "Cargo del firmante" },
    ],
  },
  {
    id: "contenido",
    label: "Contenido del documento",
    tags: [
      { tag: "{{ asunto }}", description: "Asunto del documento" },
      { tag: "{{ titulo }}", description: "Título alternativo" },
      { tag: "{{ referencia }}", description: "Referencias normativas o expedientes" },
      {
        tag: "{{ cuerpo }}",
        description: "Cuerpo principal del documento (texto generado por IA)",
      },
    ],
  },
];

/** Useful flat list when you just need the unique tag strings. */
export const ALL_TEMPLATE_TAGS: string[] = TEMPLATE_TAG_GROUPS.flatMap((g) =>
  g.tags.map((t) => t.tag)
);
