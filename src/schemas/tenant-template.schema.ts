/**
 * DocuGob — Tenant template upload schema.
 *
 * Validates everything except the file itself — the `File` object
 * lives in component state and is checked with `validateTemplateFile`
 * because Zod can't round-trip File instances cleanly.
 *
 * Mirrors the validation the backend does in
 * `tenant_template_service` so the user gets feedback before the
 * network round-trip.
 */

import { z } from "zod";

const NAME_MAX = 120;
const DESCRIPTION_MAX = 300;

export const uploadTemplateSchema = z.object({
  document_type: z.string().min(1, "Selecciona el tipo de documento"),
  name: z
    .string()
    .min(2, "Asígnale un nombre descriptivo")
    .max(NAME_MAX, `Máximo ${NAME_MAX} caracteres`),
  description: z
    .string()
    .max(DESCRIPTION_MAX, `Máximo ${DESCRIPTION_MAX} caracteres`)
    .or(z.literal("")),
});

export type UploadTemplateFormValues = z.infer<typeof uploadTemplateSchema>;

/**
 * File constraints — kept in sync with the backend's
 * `tenant_template_service` validator (10 MB cap + .docx MIME).
 */
export const TEMPLATE_MAX_BYTES = 10 * 1024 * 1024;
export const TEMPLATE_ACCEPTED_EXT = ".docx";
export const TEMPLATE_ACCEPTED_MIME = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function validateTemplateFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(TEMPLATE_ACCEPTED_EXT)) {
    return "El archivo debe ser .docx (Microsoft Word).";
  }
  // Some browsers report empty content-type for .docx — trust the
  // extension when the MIME is missing. The backend re-validates by
  // unzipping and reading word/document.xml, so this is just an
  // early UX check.
  if (
    file.type &&
    !TEMPLATE_ACCEPTED_MIME.includes(
      file.type as (typeof TEMPLATE_ACCEPTED_MIME)[number]
    )
  ) {
    return "Tipo de archivo no soportado. Sube un .docx.";
  }
  if (file.size > TEMPLATE_MAX_BYTES) {
    return `El archivo supera ${Math.round(TEMPLATE_MAX_BYTES / 1024 / 1024)} MB.`;
  }
  if (file.size === 0) {
    return "El archivo está vacío.";
  }
  return null;
}
