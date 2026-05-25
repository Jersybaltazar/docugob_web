/**
 * DocuGob — Per-doc-type UI metadata (Sprint 8 — Fase 2).
 *
 * Single source of truth for:
 *  - Wizard Step 1 cards.
 *  - Command palette entries.
 *  - Toolbar filter chips.
 *
 * Each entry mirrors a value from the backend `DocumentType` enum.
 * `comingSoon: true` flags types whose backend templates aren't ready
 * yet — the UI shows them grayed out + a badge so users see the
 * roadmap and we don't have to deploy the front when each new
 * template lands.
 */

import type { DocumentCategory, DocumentType } from "./api/types";
import {
  type LucideIcon,
  Mail,
  Mails,
  Send,
  Stamp,
  Paperclip,
  StickyNote,
  FileText,
  FileStack,
  FileSpreadsheet,
  ArrowRightCircle,
  Route,
  FileBarChart,
  FileSearch,
  Scale,
  FileCheck,
  ClipboardCheck,
  Gavel,
  ShieldCheck,
  ScrollText,
  ClipboardList,
  ListChecks,
  FilePen,
  FileQuestion,
  CalendarOff,
  CalendarClock,
  Users,
  CheckCircle2,
  BadgeCheck,
  GraduationCap,
  MessageSquare,
  Building,
  FilePlus,
  FileSignature,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

export type DocumentCategorySpec = {
  code: DocumentCategory;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const DOCUMENT_CATEGORIES: DocumentCategorySpec[] = [
  {
    code: "comunicaciones",
    label: "Comunicaciones",
    description: "Oficios, cartas y notas dirigidas a otra entidad o persona.",
    icon: MessageSquare,
  },
  {
    code: "internos",
    label: "Documentos internos",
    description: "Memorandos y proveídos entre áreas de la misma entidad.",
    icon: Building,
  },
  {
    code: "informes",
    label: "Informes",
    description: "Informes técnicos, legales y de auditoría.",
    icon: FileBarChart,
  },
  {
    code: "resoluciones",
    label: "Resoluciones",
    description: "Actos administrativos con efecto resolutivo.",
    icon: Gavel,
  },
  {
    code: "solicitudes",
    label: "Solicitudes",
    description: "Pedidos formales internos o ciudadanos.",
    icon: FilePlus,
  },
  {
    code: "actas_constancias",
    label: "Actas y constancias",
    description: "Acreditaciones, actas de reunión, certificados.",
    icon: FileSignature,
  },
];

export const DOCUMENT_CATEGORY_BY_CODE: Record<
  DocumentCategory,
  DocumentCategorySpec
> = DOCUMENT_CATEGORIES.reduce(
  (acc, spec) => {
    acc[spec.code] = spec;
    return acc;
  },
  {} as Record<DocumentCategory, DocumentCategorySpec>
);

// ---------------------------------------------------------------------------
// Document type specs
// ---------------------------------------------------------------------------

export type DocumentTypeSpec = {
  code: DocumentType;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Category bucket the wizard uses for grouping/tabs. */
  category: DocumentCategory;
  /** Hint shown under the "Crear" button when none is selected yet. */
  recommendedFor: string;
  /**
   * `true` while the backend template isn't ready. Flip to `false`
   * (or remove) when the docxtpl source + fields_schema are deployed.
   * The wizard disables the card and shows a "Próximamente" badge.
   */
  comingSoon?: boolean;
};

export const DOCUMENT_TYPES: DocumentTypeSpec[] = [
  // ---- Comunicaciones ----------------------------------------------------
  {
    code: "oficio_simple",
    label: "Oficio Simple",
    description:
      "Comunicación formal externa dirigida a un único destinatario.",
    icon: Mail,
    category: "comunicaciones",
    recommendedFor: "Solicitudes, comunicaciones a otra entidad",
  },
  {
    code: "oficio_multiple",
    label: "Oficio Múltiple",
    description:
      "Mismo cuerpo dirigido a varios destinatarios con lista de distribución.",
    icon: Mails,
    category: "comunicaciones",
    recommendedFor: "Convocatorias, circulares a varias áreas",
  },
  {
    code: "oficio_circular",
    label: "Oficio Circular",
    description:
      "Comunicación dirigida a todas las áreas o entidades de un mismo nivel.",
    icon: Send,
    category: "comunicaciones",
    recommendedFor: "Disposiciones generales, anuncios institucionales",
  },
  {
    code: "carta",
    label: "Carta Institucional",
    description:
      "Comunicación cordial dirigida a personas naturales o entidades privadas.",
    icon: Send,
    category: "comunicaciones",
    recommendedFor: "Proveedores, ciudadanos, sector privado",
  },
  {
    code: "carta_notarial",
    label: "Carta Notarial",
    description:
      "Carta con fines legales que requiere notificación notarial fehaciente.",
    icon: Stamp,
    category: "comunicaciones",
    recommendedFor: "Requerimientos legales, notificaciones formales",
  },
  {
    code: "nota_envio",
    label: "Nota de Envío",
    description:
      "Documento breve que acompaña la entrega de expedientes o archivos.",
    icon: Paperclip,
    category: "comunicaciones",
    recommendedFor: "Remisión de expedientes con cargo de recepción",
  },
  {
    code: "esquela",
    label: "Esquela",
    description:
      "Comunicación protocolar muy breve (felicitaciones, condolencias, citaciones).",
    icon: StickyNote,
    category: "comunicaciones",
    recommendedFor: "Citaciones, saludos institucionales, condolencias",
  },

  // ---- Internos ---------------------------------------------------------
  {
    code: "memorando",
    label: "Memorando",
    description:
      "Comunicación interna breve entre áreas de la misma entidad.",
    icon: FileText,
    category: "internos",
    recommendedFor: "Coordinaciones internas, instrucciones de jefatura",
  },
  {
    code: "memorando_multiple",
    label: "Memorando Múltiple",
    description:
      "Memorando dirigido a varios servidores internos a la vez.",
    icon: FileStack,
    category: "internos",
    recommendedFor: "Convocatorias internas, instrucciones a varias áreas",
  },
  {
    code: "memorando_circular",
    label: "Memorando Circular",
    description:
      "Memorando dirigido a TODO el personal o áreas de la entidad.",
    icon: FileSpreadsheet,
    category: "internos",
    recommendedFor: "Comunicados generales, políticas internas",
  },
  {
    code: "proveido",
    label: "Proveído",
    description:
      "Nota breve para derivar un trámite a otra área o funcionario.",
    icon: ArrowRightCircle,
    category: "internos",
    recommendedFor: "Derivaciones, pase a área competente",
  },
  {
    code: "hoja_ruta",
    label: "Hoja de Ruta",
    description:
      "Hoja de seguimiento de expediente entre áreas con plazos.",
    icon: Route,
    category: "internos",
    recommendedFor: "Trámites con varias áreas, control de avance",
  },

  // ---- Informes ---------------------------------------------------------
  {
    code: "informe_ordinario",
    label: "Informe Ordinario",
    description:
      "Informe estructurado con antecedentes, análisis, conclusiones y recomendaciones.",
    icon: FileBarChart,
    category: "informes",
    recommendedFor: "Informes periódicos, balances de gestión",
  },
  {
    code: "informe_tecnico",
    label: "Informe Técnico",
    description:
      "Sustento técnico-legal con citas normativas y conclusiones concretas.",
    icon: FileSearch,
    category: "informes",
    recommendedFor: "Pronunciamientos técnicos, opiniones especializadas",
  },
  {
    code: "informe_legal",
    label: "Informe Legal",
    description:
      "Opinión jurídica formal con base normativa, análisis y conclusión.",
    icon: Scale,
    category: "informes",
    recommendedFor: "Asesoría jurídica, opinión legal sobre actos",
  },
  {
    code: "informe_final",
    label: "Informe Final",
    description:
      "Cierre formal de una gestión, contrato o proyecto con resultados.",
    icon: FileCheck,
    category: "informes",
    recommendedFor: "Liquidación de contratos, cierre de proyecto",
  },
  {
    code: "informe_auditoria",
    label: "Informe de Auditoría",
    description:
      "Informe de control con hallazgos, observaciones y recomendaciones.",
    icon: ClipboardCheck,
    category: "informes",
    recommendedFor: "Auditorías internas, supervisión, control posterior",
  },

  // ---- Resoluciones -----------------------------------------------------
  {
    code: "resolucion_directoral",
    label: "Resolución Directoral",
    description:
      "Acto administrativo emitido por un Director (regional, ejecutivo, etc.).",
    icon: Gavel,
    category: "resoluciones",
    recommendedFor: "Designaciones, sanciones, autorizaciones de Director",
  },
  {
    code: "resolucion_jefatural",
    label: "Resolución Jefatural",
    description:
      "Acto administrativo emitido por jefatura de unidad u oficina.",
    icon: ShieldCheck,
    category: "resoluciones",
    recommendedFor: "Disposiciones de jefatura, encargaturas",
  },
  {
    code: "resolucion_administrativa",
    label: "Resolución Administrativa",
    description:
      "Resolución que dispone medidas de orden administrativo en general.",
    icon: ScrollText,
    category: "resoluciones",
    recommendedFor: "Aprobaciones administrativas, normativa interna",
  },
  {
    code: "directiva",
    label: "Directiva",
    description:
      "Documento que regula un procedimiento interno con carácter obligatorio.",
    icon: ClipboardList,
    category: "resoluciones",
    recommendedFor: "Procedimientos internos, lineamientos operativos",
  },
  {
    code: "disposicion",
    label: "Disposición",
    description:
      "Mandato específico que dispone una acción concreta a ejecutar.",
    icon: ListChecks,
    category: "resoluciones",
    recommendedFor: "Mandatos puntuales, instrucciones obligatorias",
  },

  // ---- Solicitudes ------------------------------------------------------
  {
    code: "solicitud_general",
    label: "Solicitud General",
    description:
      "Pedido formal ante una autoridad para iniciar o avanzar un trámite.",
    icon: FilePen,
    category: "solicitudes",
    recommendedFor: "Trámites administrativos generales",
  },
  {
    code: "solicitud_informacion",
    label: "Solicitud de Información (Ley 27806)",
    description:
      "Pedido de acceso a información pública conforme a la Ley 27806.",
    icon: FileQuestion,
    category: "solicitudes",
    recommendedFor: "Transparencia, acceso a información pública",
  },
  {
    code: "solicitud_vacaciones",
    label: "Solicitud de Vacaciones",
    description:
      "Pedido formal de programación o adelanto de vacaciones del personal.",
    icon: CalendarOff,
    category: "solicitudes",
    recommendedFor: "Programación de descanso vacacional",
  },
  {
    code: "solicitud_licencia",
    label: "Solicitud de Licencia",
    description:
      "Pedido de licencia por estudios, salud, maternidad u otros motivos.",
    icon: CalendarClock,
    category: "solicitudes",
    recommendedFor: "Licencias del régimen laboral público",
  },

  // ---- Actas y Constancias ---------------------------------------------
  {
    code: "acta_reunion",
    label: "Acta de Reunión",
    description:
      "Registro formal de los acuerdos tomados en una sesión o reunión.",
    icon: Users,
    category: "actas_constancias",
    recommendedFor: "Comités, mesas de trabajo, sesiones de directorio",
  },
  {
    code: "acta_conformidad",
    label: "Acta de Conformidad",
    description:
      "Documento que certifica conformidad de un servicio, bien u obra recibida.",
    icon: CheckCircle2,
    category: "actas_constancias",
    recommendedFor: "Recepción de bienes, conformidad de servicios",
  },
  {
    code: "constancia",
    label: "Constancia",
    description:
      "Documento declarativo que acredita un hecho o condición.",
    icon: BadgeCheck,
    category: "actas_constancias",
    recommendedFor: "Acreditaciones, verificaciones",
  },
  {
    code: "certificado",
    label: "Certificado",
    description:
      "Documento oficial que certifica capacitación, asistencia o calidad.",
    icon: GraduationCap,
    category: "actas_constancias",
    recommendedFor: "Capacitaciones, eventos, calificaciones",
  },
];

export const DOCUMENT_TYPE_BY_CODE: Record<DocumentType, DocumentTypeSpec> =
  DOCUMENT_TYPES.reduce(
    (acc, spec) => {
      acc[spec.code] = spec;
      return acc;
    },
    {} as Record<DocumentType, DocumentTypeSpec>
  );

/**
 * Convenience: types grouped by category in DOCUMENT_TYPES iteration
 * order — handy for the wizard's section-by-section rendering and
 * the command palette grouping.
 */
export function documentTypesByCategory(): Record<
  DocumentCategory,
  DocumentTypeSpec[]
> {
  const out = {} as Record<DocumentCategory, DocumentTypeSpec[]>;
  for (const cat of DOCUMENT_CATEGORIES) out[cat.code] = [];
  for (const spec of DOCUMENT_TYPES) out[spec.category].push(spec);
  return out;
}

export const DOCUMENT_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  generated: "Generado",
  reviewed: "Revisado",
  signed: "Firmado",
  archived: "Archivado",
};
