/**
 * DocuGob — Dashboard home (Server Component, Sprint 8 refresh).
 *
 * AUDIT §3.2 — three independent server reads run in parallel
 * (`Promise.all`) so the home renders fully on first paint with:
 *   1. Greeting + tenant context (from `requireCurrentUser`).
 *   2. Quick start grid: 6 categories deep-linking into the wizard
 *      with the chosen category implied (or full catalog with the
 *      "Crear documento" card).
 *   3. "Continuar donde lo dejaste" — last 5 recent documents.
 *   4. "Plantillas personalizadas" status with link to manage.
 *
 * Anything interactive (none here yet) would be a client island; for
 * now everything is pure RSC.
 */

import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  Files,
  ImageIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPE_BY_CODE,
  documentTypesByCategory,
} from "@/lib/document-types";
import { format } from "@/lib/format";
import { requireCurrentUser } from "@/lib/server/current-user";
import { getRecentDocumentsServer } from "@/lib/server/recent-documents";
import { getMyTenantTemplatesServer } from "@/lib/server/tenant-templates";
import type { DocumentListItem } from "@/lib/api/types";

export default async function DashboardHomePage() {
  // Three parallel reads — no waterfall.
  const [user, recentDocuments, tenantTemplates] = await Promise.all([
    requireCurrentUser("/dashboard"),
    getRecentDocumentsServer(5),
    getMyTenantTemplatesServer(),
  ]);

  const firstName = user.full_name?.split(" ")[0] ?? "";
  const customTemplatesCount = tenantTemplates.filter(
    (t) => !t.is_system
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {firstName ? `Hola, ${firstName}` : "Bienvenido a DocuGob"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user.current_tenant?.name
            ? `Trabajando en ${user.current_tenant.name}`
            : "Tu panel de control."}
        </p>
      </header>

      <QuickStart />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <RecentDocumentsSection documents={recentDocuments} />
        <TemplatesStatusSection customCount={customTemplatesCount} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick start — 6 categorías + atajo a "ver todas"
// ---------------------------------------------------------------------------

function QuickStart() {
  const grouped = documentTypesByCategory();

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Crear documento
          </h2>
          <p className="text-sm text-muted-foreground">
            30 plantillas en 6 categorías. Elige la familia y el asistente te
            guía paso a paso.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/documents/new">
            Ver todas las plantillas
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENT_CATEGORIES.map((cat) => {
          const count = grouped[cat.code]?.length ?? 0;
          const Icon = cat.icon;
          return (
            <Link
              key={cat.code}
              href="/dashboard/documents/new"
              className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{cat.label}</p>
                  <span className="text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {cat.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Recent documents — list with "Continuar" for drafts
// ---------------------------------------------------------------------------

function RecentDocumentsSection({
  documents,
}: {
  documents: DocumentListItem[];
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          Documentos recientes
        </h2>
        {documents.length > 0 && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/documents">
              Ver todos
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </header>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Files className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Aún no tienes documentos</p>
              <p className="text-sm text-muted-foreground">
                Crea tu primer oficio, memorando o informe para empezar.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/documents/new">
                <FilePlus2 className="mr-1 h-4 w-4" />
                Crear documento
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {documents.map((doc) => (
            <RecentRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecentRow({ doc }: { doc: DocumentListItem }) {
  const spec = DOCUMENT_TYPE_BY_CODE[doc.document_type];
  const Icon = spec?.icon ?? Files;
  const href =
    doc.status === "draft"
      ? `/dashboard/documents/new?id=${doc.id}`
      : `/dashboard/documents/${doc.id}`;

  return (
    <Link
      href={href}
      className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{doc.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {spec?.label ?? doc.document_type}
          {doc.number ? ` · ${doc.number}` : " · Sin número"}
        </p>
      </div>

      <DocumentStatusBadge status={doc.status} />

      <span className="text-xs text-muted-foreground">
        {format.dateShort(doc.updated_at)}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Templates status — small card with link to settings
// ---------------------------------------------------------------------------

function TemplatesStatusSection({
  customCount,
}: {
  customCount: number;
}) {
  const hasCustom = customCount > 0;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Plantillas</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Personalización
          </CardTitle>
          <CardDescription>
            {hasCustom
              ? "Tus plantillas reemplazan a las del sistema en cada generación."
              : "Subí tu .docx con tu membrete y pie para personalizar la marca."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasCustom ? (
            <Badge variant="secondary" className="text-xs">
              {customCount} plantilla{customCount === 1 ? "" : "s"} activa
              {customCount === 1 ? "" : "s"}
            </Badge>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aún sin plantillas propias — DocuGob usa las del sistema.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/dashboard/settings/templates">
              {hasCustom ? "Administrar plantillas" : "Subir mi primera plantilla"}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
