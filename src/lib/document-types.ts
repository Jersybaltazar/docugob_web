/**
 * DocuGob — Per-doc-type UI metadata.
 *
 * Single source of truth for the cards in wizard Step 1, the command
 * palette entries and the filter chips. Each entry mirrors a value
 * from the backend `DocumentType` enum.
 */

import type { DocumentType } from "./api/types";
import {
  type LucideIcon,
  Mail,
  Mails,
  FileText,
  FileBarChart,
  FileSearch,
  Send,
  BadgeCheck,
  ArrowRightCircle,
} from "lucide-react";

export type DocumentTypeSpec = {
  code: DocumentType;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Hint shown under the "Crear" button when none is selected yet. */
  recommendedFor: string;
};

export const DOCUMENT_TYPES: DocumentTypeSpec[] = [
  {
    code: "oficio_simple",
    label: "Oficio Simple",
    description:
      "Comunicación formal externa dirigida a un único destinatario.",
    icon: Mail,
    recommendedFor: "Solicitudes, comunicaciones a otra entidad",
  },
  {
    code: "oficio_multiple",
    label: "Oficio Múltiple",
    description:
      "Mismo cuerpo dirigido a varios destinatarios con lista de distribución.",
    icon: Mails,
    recommendedFor: "Convocatorias, circulares a varias áreas",
  },
  {
    code: "memorando",
    label: "Memorando",
    description:
      "Comunicación interna breve entre áreas de la misma entidad.",
    icon: FileText,
    recommendedFor: "Coordinaciones internas, instrucciones de jefatura",
  },
  {
    code: "informe_ordinario",
    label: "Informe Ordinario",
    description:
      "Informe estructurado con antecedentes, análisis, conclusiones y recomendaciones.",
    icon: FileBarChart,
    recommendedFor: "Informes periódicos, balances de gestión",
  },
  {
    code: "informe_tecnico",
    label: "Informe Técnico",
    description:
      "Sustento técnico-legal con citas normativas y conclusiones concretas.",
    icon: FileSearch,
    recommendedFor: "Pronunciamientos, opiniones legales y técnicas",
  },
  {
    code: "carta",
    label: "Carta Institucional",
    description:
      "Comunicación cordial dirigida a personas naturales o entidades privadas.",
    icon: Send,
    recommendedFor: "Proveedores, ciudadanos, entidades del sector privado",
  },
  {
    code: "constancia",
    label: "Constancia",
    description:
      "Documento declarativo que acredita un hecho o condición.",
    icon: BadgeCheck,
    recommendedFor: "Acreditaciones, verificaciones, certificaciones",
  },
  {
    code: "proveido",
    label: "Proveído",
    description:
      "Nota breve para derivar un trámite a otra área o funcionario.",
    icon: ArrowRightCircle,
    recommendedFor: "Derivaciones internas, pase a área competente",
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

export const DOCUMENT_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  generated: "Generado",
  reviewed: "Revisado",
  signed: "Firmado",
  archived: "Archivado",
};
