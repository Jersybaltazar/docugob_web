"use client";

/**
 * DocuGob — Upload tenant template dialog.
 *
 * Renders a modal with the metadata form + file picker. The file is
 * not part of the Zod schema (Zod can't round-trip File cleanly), so
 * we keep it in component state and validate manually with
 * `validateTemplateFile` from the schema module.
 *
 * Submitting → calls `useUploadTenantTemplate`, which invalidates
 * both the tenant-templates cache and the wizard's catalog query so
 * the new template kicks in immediately for document generation.
 */

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormGenerator } from "@/components/forms/form-generator";
import { toast } from "@/components/ui/use-toast";

import { useUploadTenantTemplate } from "@/hooks/tenant/use-tenant-templates";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import {
  uploadTemplateSchema,
  validateTemplateFile,
  TEMPLATE_ACCEPTED_EXT,
  type UploadTemplateFormValues,
} from "@/schemas/tenant-template.schema";
import type { DocumentType } from "@/lib/api/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a document_type (replace flow). Leave undefined for fresh upload. */
  initialDocumentType?: DocumentType;
  /** Optional pre-filled name for replace flows. */
  initialName?: string;
};

export function UploadTemplateDialog({
  open,
  onOpenChange,
  initialDocumentType,
  initialName,
}: Props) {
  const upload = useUploadTenantTemplate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    getValues,
  } = useForm<UploadTemplateFormValues>({
    resolver: zodResolver(uploadTemplateSchema),
    defaultValues: {
      document_type: initialDocumentType ?? "",
      name: initialName ?? "",
      description: "",
    },
    mode: "onChange",
  });

  // Sync the form whenever the dialog opens/closes or the parent
  // changes the pre-filled values. Adjust-state-during-render keeps
  // us out of the `set-state-in-effect` rule. Reseting on every
  // transition also ensures the file picker doesn't leak state from
  // a previous interaction.
  const [lastInit, setLastInit] = useState({
    open,
    initialDocumentType,
    initialName,
  });
  if (
    lastInit.open !== open ||
    lastInit.initialDocumentType !== initialDocumentType ||
    lastInit.initialName !== initialName
  ) {
    setLastInit({ open, initialDocumentType, initialName });
    setFile(null);
    if (open) {
      reset({
        document_type: initialDocumentType ?? "",
        name: initialName ?? "",
        description: "",
      });
    }
  }

  const handleFile = (picked: File) => {
    const err = validateTemplateFile(picked);
    if (err) {
      toast({ title: "Error", description: err, variant: "destructive" });
      return;
    }
    setFile(picked);
    // Suggest a name based on filename if the field is still empty.
    const current = getValues("name");
    if (!current) {
      setValue("name", picked.name.replace(/\.docx$/i, ""), {
        shouldDirty: true,
      });
    }
  };

  const onSubmit = handleSubmit((values) => {
    if (!file) {
      toast({
        title: "Error",
        description: "Selecciona el archivo .docx antes de subir.",
        variant: "destructive",
      });
      return;
    }
    upload.mutate(
      {
        document_type: values.document_type as DocumentType,
        name: values.name,
        description: values.description || undefined,
        file,
      },
      {
        onSuccess: () => {
          reset();
          setFile(null);
          onOpenChange(false);
        },
      }
    );
  });

  const documentTypeOptions = DOCUMENT_TYPES.map((spec) => ({
    value: spec.code,
    label: spec.label,
  }));

  const submitting = isSubmitting || upload.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir plantilla personalizada</DialogTitle>
          <DialogDescription>
            Tu .docx reemplazará a la plantilla del sistema para ese tipo de
            documento. Debe contener al menos un tag Jinja2 (por ejemplo{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {"{{ cuerpo }}"}
            </code>
            ).
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <FormGenerator<UploadTemplateFormValues>
            inputType="select"
            name="document_type"
            label="Tipo de documento"
            placeholder="Selecciona un tipo..."
            options={documentTypeOptions}
            register={register}
            errors={errors}
          />

          <FormGenerator<UploadTemplateFormValues>
            inputType="input"
            name="name"
            label="Nombre"
            placeholder='Ej: "Oficio Simple — RED Huamalíes"'
            register={register}
            errors={errors}
          />

          <FormGenerator<UploadTemplateFormValues>
            inputType="textarea"
            name="description"
            label="Descripción"
            placeholder="Cuándo usar esta plantilla, notas para el equipo..."
            description="Opcional. Visible solo para tu entidad."
            register={register}
            errors={errors}
            rows={2}
          />

          {/* File picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Archivo .docx
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={TEMPLATE_ACCEPTED_EXT}
              className="sr-only"
              onChange={(event) => {
                const picked = event.target.files?.[0];
                if (picked) handleFile(picked);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-md border border-dashed bg-muted/30 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50"
            >
              {file ? (
                <>
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 truncate">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB · Reemplazar
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Selecciona tu .docx</p>
                    <p className="text-xs text-muted-foreground">
                      Máximo 10 MB. Debe contener tags Jinja2.
                    </p>
                  </div>
                </>
              )}
            </button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !file}>
              {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Subir plantilla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
