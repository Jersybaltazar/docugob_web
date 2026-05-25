/**
 * DocuGob — /dashboard/settings/templates (Server Component).
 *
 * Sprint 8 — replaces the previous branding-by-images page. Tenants
 * upload their full `.docx` (with their own letterhead and footer
 * already designed in Word). The system fills only the body via
 * Jinja2 tags — see `lib/template-tags.ts` for the available
 * placeholders.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TenantTemplatesManager } from "@/components/settings/tenant-templates-manager";
import { TenantTemplatesHydrator } from "@/components/providers/tenant-templates-hydrator";
import { Button } from "@/components/ui/button";
import { getMyTenantTemplatesServer } from "@/lib/server/tenant-templates";
import { requireCurrentUser } from "@/lib/server/current-user";

export const metadata: Metadata = {
  title: "Mis plantillas",
  description:
    "Sube y administra tus plantillas .docx personalizadas con tu propio membrete y pie de página.",
};

export default async function TenantTemplatesSettingsPage() {
  await requireCurrentUser("/dashboard/settings/templates");
  const templates = await getMyTenantTemplatesServer();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/settings">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a configuración
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mis plantillas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube tus propios archivos .docx con tu membrete y pie de página.
            Cuando subes una plantilla, reemplaza a la del sistema para ese
            tipo de documento; al eliminarla, vuelve a usarse la del sistema.
          </p>
        </div>
      </header>

      <TenantTemplatesHydrator templates={templates} />
      <TenantTemplatesManager initialTemplates={templates} />
    </div>
  );
}
