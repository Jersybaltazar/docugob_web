"use client";

/**
 * DocuGob — Wizard Step 2: dynamic data form.
 *
 * Renders fields driven by the selected document type's
 * `Template.fields_schema`. Replaces the hard-coded layout that
 * shipped in Sprint 2 frontend.
 *
 * Source of truth for each field's shape is the backend; this file
 * only knows about *how* to render the parsed FieldSpec[] (text input,
 * textarea, or repeating array).
 */

import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { ArrayField } from "./array-field";
import { DynamicField } from "./dynamic-field";
import { useWizard } from "./wizard-context";
import { useCreateDocument, useUpdateDocument } from "@/hooks/use-documents";
import { useTemplateForType } from "@/hooks/use-templates";
import { DOCUMENT_TYPE_BY_CODE } from "@/lib/document-types";
import { normalizeFieldsSchema, type FieldSpec } from "@/lib/form-schema";
import { ApiError } from "@/lib/api/client";

type FormShape = {
  title: string;
  area_id?: string;
  content_data: Record<string, unknown>;
};

function buildZodSchema(
  required: Set<string>,
  arrayMinItems: Map<string, number>
) {
  // Validate `title` always; everything else is propagated as content_data
  // and validated via required[] from JSON Schema.
  return z.object({
    title: z
      .string()
      .min(2, "El título es obligatorio")
      .max(500, "Demasiado largo"),
    area_id: z
      .string()
      .max(12, "Usa hasta 12 caracteres (ej: UAJ, LOG)")
      .optional()
      .or(z.literal("")),
    content_data: z
      .record(z.string(), z.unknown())
      .superRefine((data, ctx) => {
        // 1. Required scalar fields must not be empty.
        for (const name of required) {
          if (name === "title" || name === "area_id") continue;
          const value = (data as Record<string, unknown>)[name];
          if (arrayMinItems.has(name)) continue; // arrays validated below
          if (
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "")
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [name],
              message: "Este campo es obligatorio",
            });
          }
        }
        // 2. Array fields with minItems must meet the lower bound.
        for (const [name, min] of arrayMinItems) {
          const value = (data as Record<string, unknown>)[name];
          if (!Array.isArray(value) || value.length < min) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [name],
              message:
                min === 1
                  ? "Agrega al menos 1 elemento"
                  : `Agrega al menos ${min} elementos`,
            });
          }
        }
      }),
  });
}

export function StepFields() {
  const {
    documentType,
    documentId,
    title,
    contentData,
    aiGeneratedBody,
    setTitle,
    patchContent,
    setDocument,
    setAIGeneratedBody,
    back,
    next,
  } = useWizard();

  const { data: template, isLoading: templateLoading } =
    useTemplateForType(documentType);

  const create = useCreateDocument();
  const update = useUpdateDocument(documentId ?? "");

  const normalized = useMemo(
    () => normalizeFieldsSchema(template?.fields_schema ?? null),
    [template?.fields_schema]
  );

  const requiredSet = useMemo(
    () => new Set(normalized.requiredFields),
    [normalized]
  );
  const arrayMinItems = useMemo(() => {
    const map = new Map<string, number>();
    for (const field of normalized.allFields) {
      if (field.kind === "array") {
        map.set(field.name, field.minItems ?? (field.required ? 1 : 0));
      }
    }
    return map;
  }, [normalized]);

  const zodSchema = useMemo(
    () => buildZodSchema(requiredSet, arrayMinItems),
    [requiredSet, arrayMinItems]
  );

  const defaults = useMemo<FormShape>(() => {
    const baseContent = { ...(contentData ?? {}) } as Record<string, unknown>;
    // Carry the latest AI-written cuerpo into the form so the user can
    // tweak it manually if they want.
    if (aiGeneratedBody && !baseContent.cuerpo) {
      baseContent.cuerpo = aiGeneratedBody;
    }
    // Ensure every array field has at least the required minimum so
    // useFieldArray renders the right number of rows.
    for (const [name, min] of arrayMinItems) {
      const existing = baseContent[name];
      if (Array.isArray(existing) && existing.length >= min) continue;
      const fieldSpec = normalized.allFields.find((f) => f.name === name);
      const itemSpecs = fieldSpec?.itemFields ?? [];
      const blank = () =>
        Object.fromEntries(itemSpecs.map((f) => [f.name, ""]));
      const current = Array.isArray(existing) ? [...existing] : [];
      while (current.length < min) current.push(blank());
      baseContent[name] = current;
    }
    return {
      title,
      area_id: typeof baseContent.area_id === "string" ? baseContent.area_id : "",
      content_data: baseContent,
    };
  }, [title, contentData, aiGeneratedBody, arrayMinItems, normalized.allFields]);

  const methods = useForm<FormShape>({
    resolver: zodResolver(zodSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  // Re-seed the form once the template + draft load — happens when
  // the user enters via ?id= or changes type.
  useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults.title, documentId, normalized.allFields.length]);

  const spec = documentType ? DOCUMENT_TYPE_BY_CODE[documentType] : null;

  const onSubmit = handleSubmit(async (values) => {
    if (!documentType) {
      toast.error("Selecciona un tipo de documento primero");
      return;
    }

    // Strip empty strings from content_data so JSONB stays compact.
    const cleanContent = Object.fromEntries(
      Object.entries(values.content_data).filter(([, v]) => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === "string") return v.trim() !== "";
        return v !== undefined && v !== null;
      })
    );
    if (values.area_id) cleanContent.area_id = values.area_id;

    setTitle(values.title);
    patchContent(cleanContent);
    if (typeof cleanContent.cuerpo === "string" && cleanContent.cuerpo) {
      setAIGeneratedBody(cleanContent.cuerpo);
    }

    try {
      const doc = documentId
        ? await update.mutateAsync({
            title: values.title,
            content_data: cleanContent,
            ai_generated_body:
              typeof cleanContent.cuerpo === "string"
                ? cleanContent.cuerpo
                : undefined,
          })
        : await create.mutateAsync({
            document_type: documentType,
            title: values.title,
            content_data: cleanContent,
            area_id: values.area_id || undefined,
          });
      setDocument(doc);
      toast.success(documentId ? "Borrador actualizado" : "Borrador guardado");
      next();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo guardar el borrador";
      toast.error(message);
    }
  });

  const saving = isSubmitting || create.isPending || update.isPending;

  if (templateLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!template || normalized.groups.length === 0) {
    return (
      <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-5 text-sm">
        No hay una plantilla activa para este tipo de documento. Contacta
        soporte o ejecuta los seeds del backend (
        <code>scripts/seed_templates.py</code>).
      </div>
    );
  }

  // Per-content_data errors keyed by field name (from superRefine).
  const contentErrors = errors.content_data as
    | Record<string, { message?: string }>
    | undefined;

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Datos básicos
          </h2>
          <p className="text-sm text-muted-foreground">
            {spec
              ? `Estás creando un ${spec.label.toLowerCase()}. Completa los campos del destinatario, asunto y referencia.`
              : "Completa los datos del documento."}
          </p>
        </header>

        {/* Always-on basic section */}
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Título interno del documento
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Solicitud de información epidemiológica IV trimestre"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title?.message && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Sólo lo verás tú en tu listado. No aparece en el documento final.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_id">Siglas del área</Label>
            <Input
              id="area_id"
              placeholder="UAJ, LOG, RRHH..."
              maxLength={12}
              {...register("area_id")}
            />
            <p className="text-xs text-muted-foreground">
              Se usa en la numeración (ej: N° 045-2026-RSH/UAJ).
            </p>
          </div>
        </section>

        {/* Dynamic groups from the template's fields_schema */}
        {normalized.groups.map((group) => (
          <section
            key={group.id}
            className="rounded-lg border bg-card p-5 space-y-4"
          >
            <header className="space-y-0.5">
              <h3 className="text-sm font-medium">{group.label}</h3>
              {group.hint && (
                <p className="text-xs text-muted-foreground">{group.hint}</p>
              )}
            </header>
            {renderGroupFields(group.fields, register, contentErrors)}
          </section>
        ))}

        <footer className="flex items-center justify-between gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={back}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Atrás
          </Button>
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {documentId ? "Guardar y continuar" : "Crear borrador y continuar"}
            {!saving && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </footer>
      </form>
    </FormProvider>
  );
}

function renderGroupFields(
  fields: FieldSpec[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any,
  contentErrors?: Record<string, { message?: string }>
) {
  // Pair string/text fields two-up on wider screens, give textareas full width.
  const scalarFields = fields.filter((f) => f.kind !== "array");
  const arrayFields = fields.filter((f) => f.kind === "array");

  const textareaNames = new Set(
    scalarFields.filter((f) => f.kind === "textarea").map((f) => f.name)
  );
  const inlineFields = scalarFields.filter(
    (f) => !textareaNames.has(f.name)
  );
  const blockFields = scalarFields.filter((f) =>
    textareaNames.has(f.name)
  );

  return (
    <div className="space-y-4">
      {inlineFields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {inlineFields.map((field) => (
            <DynamicField
              key={field.name}
              spec={field}
              registration={register(
                `content_data.${field.name}` as const
              )}
              error={contentErrors?.[field.name]?.message}
            />
          ))}
        </div>
      )}
      {blockFields.map((field) => (
        <DynamicField
          key={field.name}
          spec={field}
          registration={register(`content_data.${field.name}` as const)}
          error={contentErrors?.[field.name]?.message}
        />
      ))}
      {arrayFields.map((field) => (
        <ArrayField key={field.name} spec={field} />
      ))}
    </div>
  );
}
