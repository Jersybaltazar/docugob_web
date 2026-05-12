"use client";

/**
 * DocuGob — Faithful HTML preview that mirrors the .docx layout.
 *
 * TDR §7.1 — "vista previa fiel (PDF embebido o render HTML estilo
 * Word)". This component renders the second option: a Word-like HTML
 * approximation generated from the wizard state, useful BEFORE the
 * user clicks "Generar". Once the document is generated, the wizard
 * swaps to the embedded PDF (`<PdfViewer />`) when available, falling
 * back to this HTML preview otherwise.
 *
 * The visual conventions match the templates the backend produces:
 *  - Centered entity header in bold
 *  - Right-aligned lugar/fecha
 *  - Document number under the header
 *  - Label-value pairs for Asunto / Referencia
 *  - Justified body paragraphs
 *  - Closing fórmula + signature block
 *  - Distribution list at the bottom for "oficio múltiple"
 */

import { useMemo } from "react";
import type { DocumentType } from "@/lib/api/types";
import { format } from "@/lib/format";

type DocumentPreviewProps = {
  documentType: DocumentType | null;
  title: string;
  number?: string | null;
  entityName?: string;
  ruc?: string;
  city?: string;
  date?: Date | string;
  content: Record<string, unknown>;
  /** Plain-text body (from the editor or AI). */
  body: string;
  /** Free-plan watermark text. Empty disables it. */
  watermark?: string;
};

export function DocumentPreview({
  documentType,
  title,
  number,
  entityName = "Tu entidad",
  ruc,
  city = "Huánuco",
  date,
  content,
  body,
  watermark,
}: DocumentPreviewProps) {
  const numberLabel = useMemo(() => deriveNumberLabel(documentType, number), [
    documentType,
    number,
  ]);

  const lugarFecha = useMemo(() => {
    const d = date instanceof Date ? date : date ? new Date(date) : new Date();
    return `${city}, ${format.dateLong(d).toLowerCase()}`;
  }, [city, date]);

  const destinatarios = Array.isArray(content.destinatarios)
    ? (content.destinatarios as Array<Record<string, unknown>>)
    : [];

  return (
    <article
      className="docugob-preview relative mx-auto w-full max-w-[680px] rounded-md border bg-white shadow-sm"
      aria-label="Vista previa del documento"
    >
      {watermark && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 grid place-items-center select-none"
          style={{ transform: "rotate(-30deg)" }}
        >
          <span className="text-6xl font-black text-zinc-200/80 tracking-widest uppercase">
            {watermark}
          </span>
        </span>
      )}

      <div className="relative px-12 py-10 space-y-4 leading-relaxed">
        <header className="text-center space-y-1">
          <p className="font-semibold text-sm uppercase tracking-wide">
            {entityName}
          </p>
          {ruc && <p className="text-[10px]">RUC: {ruc}</p>}
        </header>

        <p className="font-bold pt-4 text-sm">{numberLabel}</p>
        <p className="text-right text-sm">{lugarFecha}</p>

        {documentType === "memorando" || documentType?.startsWith("informe") ? (
          <MemoStyleHeader content={content} />
        ) : documentType === "oficio_multiple" ? (
          <MultipleHeader />
        ) : (
          <OficioStyleHeader content={content} />
        )}

        {documentType === "constancia" ? (
          <ConstanciaPreamble content={content} />
        ) : (
          <LabeledFields content={content} />
        )}

        <p className="text-sm whitespace-pre-line py-2 text-justify">
          {body || (
            <span className="italic text-zinc-400">
              El cuerpo aparecerá aquí cuando lo generes o redactes.
            </span>
          )}
        </p>

        <ClosingFormula documentType={documentType} />

        <SignatureBlock content={content} entityName={entityName} />

        {destinatarios.length > 0 && (
          <DistributionList destinatarios={destinatarios} />
        )}

        <p className="text-[10px] pt-2 opacity-70">
          {String(content.siglas_entidad ?? "")}
          {content.area_id ? `/${content.area_id}` : ""}
        </p>

        {watermark && (
          <p className="text-center text-[9px] pt-2 opacity-70">
            Generado con DocuGob — Plan Gratuito
          </p>
        )}
      </div>

      <p className="border-t bg-muted/30 px-4 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {title || "Sin título"}
      </p>
    </article>
  );
}

function deriveNumberLabel(
  documentType: DocumentType | null,
  number: string | null | undefined
): string {
  const placeholder = "N° (se asignará al generar)";
  if (!number) {
    switch (documentType) {
      case "memorando":
        return `MEMORANDO ${placeholder}`;
      case "informe_ordinario":
        return `INFORME ${placeholder}`;
      case "informe_tecnico":
        return `INFORME TÉCNICO ${placeholder}`;
      case "constancia":
        return `CONSTANCIA ${placeholder}`;
      case "proveido":
        return `PROVEÍDO ${placeholder}`;
      default:
        return placeholder;
    }
  }
  switch (documentType) {
    case "memorando":
      return `MEMORANDO ${number}`;
    case "informe_ordinario":
      return `INFORME ${number}`;
    case "informe_tecnico":
      return `INFORME TÉCNICO ${number}`;
    case "constancia":
      return `CONSTANCIA ${number}`;
    case "proveido":
      return `PROVEÍDO ${number}`;
    default:
      return number;
  }
}

function OficioStyleHeader({ content }: { content: Record<string, unknown> }) {
  const get = (k: string) => String(content[k] ?? "");
  return (
    <div className="text-sm space-y-0">
      <p>Señor(a):</p>
      <p className="font-semibold">{get("destinatario_nombre") || "—"}</p>
      <p>{get("destinatario_cargo") || ""}</p>
      {get("destinatario_entidad") && <p>{get("destinatario_entidad")}</p>}
      {get("destinatario_direccion") && (
        <p>{get("destinatario_direccion")}</p>
      )}
      <p className="pt-2">Presente.-</p>
    </div>
  );
}

function MultipleHeader() {
  return (
    <div className="text-sm space-y-0">
      <p>Señor(a):</p>
      <p className="font-semibold">
        Funcionarios y servidores que se indican en la relación adjunta
      </p>
      <p className="pt-2">Presente.-</p>
    </div>
  );
}

function MemoStyleHeader({ content }: { content: Record<string, unknown> }) {
  const get = (k: string) => String(content[k] ?? "");
  return (
    <dl className="grid grid-cols-[80px_1fr] gap-x-3 text-sm">
      <dt className="font-semibold">A:</dt>
      <dd>
        {get("destinatario_nombre") || "—"} — {get("destinatario_cargo") || ""}
      </dd>
      <dt className="font-semibold">DE:</dt>
      <dd>
        {get("remitente_nombre") || "—"} — {get("remitente_cargo") || ""}
      </dd>
      <dt className="font-semibold">ASUNTO:</dt>
      <dd>{get("asunto") || "—"}</dd>
      {get("referencia") && (
        <>
          <dt className="font-semibold">REF.:</dt>
          <dd>{get("referencia")}</dd>
        </>
      )}
    </dl>
  );
}

function LabeledFields({ content }: { content: Record<string, unknown> }) {
  const asunto = String(content.asunto ?? "");
  const referencia = String(content.referencia ?? "");
  if (!asunto && !referencia) return null;
  return (
    <div className="text-sm pt-2 space-y-1">
      {asunto && (
        <p>
          <span className="font-semibold">Asunto: </span>
          {asunto}
        </p>
      )}
      {referencia && (
        <p>
          <span className="font-semibold">Referencia: </span>
          {referencia}
        </p>
      )}
    </div>
  );
}

function ConstanciaPreamble({
  content,
}: {
  content: Record<string, unknown>;
}) {
  const remitenteCargo = String(content.remitente_cargo ?? "—");
  return (
    <div className="text-sm space-y-2 pt-2">
      <p className="text-justify">
        El que suscribe, en su calidad de {remitenteCargo}, en uso de las
        atribuciones conferidas por la normativa vigente:
      </p>
      <p className="text-center font-semibold">HACE CONSTAR:</p>
    </div>
  );
}

function ClosingFormula({
  documentType,
}: {
  documentType: DocumentType | null;
}) {
  if (!documentType) return null;
  switch (documentType) {
    case "oficio_simple":
      return (
        <p className="text-sm text-justify">
          Es propicia la oportunidad para expresarle las muestras de mi
          consideración y estima personal.
        </p>
      );
    case "oficio_multiple":
      return (
        <p className="text-sm text-justify">
          Sin otro particular, hago propicia la oportunidad para expresarles
          las muestras de mi consideración.
        </p>
      );
    case "informe_ordinario":
    case "informe_tecnico":
      return (
        <p className="text-sm text-justify">
          Es todo cuanto puedo informar a usted, para los fines pertinentes.
        </p>
      );
    case "carta":
      return (
        <p className="text-sm text-justify">
          Agradezco anticipadamente su gentil atención y aprovecho la
          oportunidad para reiterarle las muestras de mi mayor consideración.
        </p>
      );
    default:
      return null;
  }
}

function SignatureBlock({
  content,
  entityName,
}: {
  content: Record<string, unknown>;
  entityName: string;
}) {
  const remitenteName = String(content.remitente_nombre ?? "—");
  const remitenteCargo = String(content.remitente_cargo ?? "");
  return (
    <div className="pt-8 text-center text-sm space-y-0">
      <p>Atentamente,</p>
      <p className="pt-12">_______________________________________</p>
      <p className="font-semibold">{remitenteName}</p>
      <p>{remitenteCargo}</p>
      <p>{entityName}</p>
    </div>
  );
}

function DistributionList({
  destinatarios,
}: {
  destinatarios: Array<Record<string, unknown>>;
}) {
  return (
    <section className="pt-6 text-xs space-y-1">
      <p className="font-bold">DISTRIBUCIÓN</p>
      <ol className="space-y-0.5">
        {destinatarios.map((d, idx) => (
          <li key={idx}>
            {idx + 1}. {String(d.nombre ?? "—")} — {String(d.cargo ?? "")}
            {d.entidad ? `, ${String(d.entidad)}` : ""}
          </li>
        ))}
      </ol>
    </section>
  );
}
