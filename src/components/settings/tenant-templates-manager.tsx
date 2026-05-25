"use client";

/**
 * DocuGob — Manager of tenant-uploaded `.docx` templates.
 *
 * Two-column layout on desktop, single-column on mobile:
 *   - Left:  list of templates the tenant has uploaded (cards with
 *            download / replace / delete actions). Empty state with
 *            CTA to upload the first one.
 *   - Right: Jinja2 tag reference panel so the user knows what
 *            placeholders to put in their .docx before uploading.
 *
 * Upload + replace funnel through the same `<UploadTemplateDialog>`;
 * the only difference is whether `initialDocumentType` is set, so
 * "Reemplazar" pre-selects the type and the user just picks the new
 * file.
 */

import { useState } from "react";
import {
  Download,
  FilePlus2,
  FileText,
  Info,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { UploadTemplateDialog } from "./upload-template-dialog";
import {
  downloadTenantTemplate,
  useDeleteTenantTemplate,
  useMyTenantTemplates,
} from "@/hooks/tenant/use-tenant-templates";
import { DOCUMENT_TYPE_BY_CODE } from "@/lib/document-types";
import { TEMPLATE_TAG_GROUPS } from "@/lib/template-tags";
import type {
  DocumentType,
  TemplateListItem,
} from "@/lib/api/types";

type Props = {
  initialTemplates: TemplateListItem[];
};

export function TenantTemplatesManager({ initialTemplates }: Props) {
  const { data } = useMyTenantTemplates();
  const templates = (data ?? initialTemplates).filter((t) => !t.is_system);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceFor, setReplaceFor] = useState<TemplateListItem | null>(null);

  const openFreshUpload = () => {
    setReplaceFor(null);
    setUploadOpen(true);
  };

  const openReplace = (tpl: TemplateListItem) => {
    setReplaceFor(tpl);
    setUploadOpen(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Plantillas subidas ({templates.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Tienen prioridad sobre las plantillas del sistema.
            </p>
          </div>
          <Button onClick={openFreshUpload}>
            <FilePlus2 className="mr-1 h-4 w-4" />
            Subir plantilla
          </Button>
        </header>

        {templates.length === 0 ? (
          <EmptyState onUpload={openFreshUpload} />
        ) : (
          <div className="space-y-3">
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onReplace={() => openReplace(tpl)}
              />
            ))}
          </div>
        )}
      </div>

      <TagsReferencePanel />

      <UploadTemplateDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        initialDocumentType={
          replaceFor ? (replaceFor.document_type as DocumentType) : undefined
        }
        initialName={replaceFor?.name}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-6 w-6" aria-hidden />
        </div>
        <div className="space-y-1 max-w-md">
          <p className="font-medium">Aún no has subido plantillas propias</p>
          <p className="text-sm text-muted-foreground">
            Mientras tanto, DocuGob usa las plantillas del sistema. Sube tu
            primer .docx con tu propio membrete y pie de página para
            personalizar los documentos generados.
          </p>
        </div>
        <Button onClick={onUpload}>
          <FilePlus2 className="mr-1 h-4 w-4" />
          Subir mi primera plantilla
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onReplace,
}: {
  template: TemplateListItem;
  onReplace: () => void;
}) {
  const docType = DOCUMENT_TYPE_BY_CODE[template.document_type];
  const Icon = docType?.icon ?? FileText;
  const [downloading, setDownloading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useDeleteTenantTemplate();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadTenantTemplate(template.id, template.name);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start gap-4 py-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium" title={template.name}>
              {template.name}
            </p>
            <Badge variant="outline" className="text-[10px]">
              {docType?.label ?? template.document_type}
            </Badge>
            {template.is_active ? (
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300">
                Activa
              </Badge>
            ) : (
              <Badge variant="secondary">Inactiva</Badge>
            )}
          </div>
          {template.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Versión {template.version}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1 h-3.5 w-3.5" />
            )}
            Descargar
          </Button>
          <Button variant="outline" size="sm" onClick={onReplace}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Reemplazar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="text-destructive hover:text-destructive"
            disabled={del.isPending}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar plantilla personalizada</DialogTitle>
            <DialogDescription>
              Al eliminar <span className="font-medium">{template.name}</span>,
              DocuGob volverá a usar la plantilla del sistema para{" "}
              <span className="font-medium">
                {docType?.label ?? template.document_type}
              </span>
              . El archivo original se borrará del servidor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={del.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                del.mutate(template.id, {
                  onSuccess: () => setConfirmDelete(false),
                })
              }
              disabled={del.isPending}
            >
              {del.isPending && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              Eliminar plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tag reference panel
// ---------------------------------------------------------------------------

function TagsReferencePanel() {
  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-primary" />
          Tags disponibles
        </CardTitle>
        <CardDescription>
          Pega estos placeholders en tu .docx donde quieras que el sistema
          rellene el contenido al generar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {TEMPLATE_TAG_GROUPS.map((group) => (
          <section key={group.id} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h4>
            <ul className="space-y-1.5">
              {group.tags.map((t) => (
                <li key={t.tag} className="space-y-0.5">
                  <code className="inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {t.tag}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

