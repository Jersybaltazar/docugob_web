"use client";

/**
 * DocuGob — /dashboard/settings
 *
 * Mostly read-only for the MVP. Future sprints land here:
 *  - S6: editable tenant name + numbering acronym (needs backend PATCH)
 *  - S7: members & roles, branding (logo upload, primary color)
 *  - S9: 2FA, immutable audit log viewer, API keys
 *
 * Showing the planned-but-not-yet rows explicitly keeps users informed
 * about what's coming and avoids the "where is X?" support load.
 */

import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Clock,
  Image as ImageIcon,
  KeyRound,
  Mail,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useCurrentUser } from "@/hooks/use-auth";
import { format } from "@/lib/format";

export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const tenant = user.current_tenant;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos de tu cuenta y de tu entidad. Lo que aún no se puede editar
          aquí está marcado como próximamente.
        </p>
      </header>

      {/* ----- Profile ------------------------------------------------- */}
      <Section
        title="Mi perfil"
        description="Datos personales asociados a tu cuenta."
        icon={<User className="h-4 w-4" />}
      >
        <Field
          icon={<User className="h-3.5 w-3.5" />}
          label="Nombre completo"
          value={user.full_name}
        />
        <Field
          icon={<Mail className="h-3.5 w-3.5" />}
          label="Correo electrónico"
          value={user.email}
          hint={
            user.is_verified ? (
              <Badge variant="outline" className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                Verificado
              </Badge>
            ) : (
              <Badge variant="secondary">Sin verificar</Badge>
            )
          }
        />
        <Field
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label="Rol en la entidad"
          value={user.current_role ?? "—"}
        />
        <Field
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Último inicio de sesión"
          value={
            user.last_login_at
              ? format.dateTime(user.last_login_at)
              : "Primera sesión"
          }
        />
      </Section>

      {/* ----- Entity ------------------------------------------------- */}
      <Section
        title="Mi entidad"
        description="Datos institucionales que aparecen en cada documento."
        icon={<Building2 className="h-4 w-4" />}
        action={
          <Badge variant="outline" className="text-[10px]">
            Edición disponible próximamente
          </Badge>
        }
      >
        <Field
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Nombre de la entidad"
          value={tenant?.name ?? "—"}
        />
        <Field
          icon={<KeyRound className="h-3.5 w-3.5" />}
          label="Subdominio"
          value={tenant?.slug ? `${tenant.slug}.docugob.pe` : "—"}
          hint={
            <span className="text-[10px] text-muted-foreground">
              Activo desde el plan Institucional
            </span>
          }
        />
        <Field
          icon={<BadgeCheck className="h-3.5 w-3.5" />}
          label="Plan actual"
          value={tenant?.plan ?? "—"}
          hint={
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/billing">Gestionar plan</Link>
            </Button>
          }
        />
      </Section>

      {/* ----- Future / locked features -------------------------------- */}
      <Section
        title="Próximas funcionalidades"
        description="Estas opciones llegan en los siguientes sprints. Si te interesan particularmente, escríbenos."
        icon={<AlertCircle className="h-4 w-4" />}
      >
        <LockedRow
          icon={<Users className="h-4 w-4" />}
          title="Equipo y roles"
          description="Invita a miembros, asígnales rol (admin / editor / lector) y áreas (Logística, RR.HH., Asesoría Legal)."
          sprint="Sprint 7"
        />
        <LockedRow
          icon={<ImageIcon className="h-4 w-4" />}
          title="Branding institucional"
          description="Sube el logo de tu entidad, ajusta los colores y personaliza el membrete de cada documento."
          sprint="Sprint 7"
        />
        <LockedRow
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Autenticación de dos factores (2FA)"
          description="Protege tu cuenta con una clave temporal generada por Google Authenticator, Authy o similares."
          sprint="Sprint 9"
        />
        <LockedRow
          icon={<KeyRound className="h-4 w-4" />}
          title="Audit log inmutable"
          description="Revisa cada documento generado, quién lo creó y cuándo, con verificación criptográfica."
          sprint="Sprint 9"
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-start justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          <div>
            <h2 className="font-medium leading-tight">{title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action}
      </header>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function Field({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-3.5">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium" title={value}>
          {value}
        </p>
      </div>
      {hint}
    </div>
  );
}

function LockedRow({
  icon,
  title,
  description,
  sprint,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  sprint: string;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-4">
      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{title}</h3>
          <Badge variant="outline" className="text-[10px]">
            {sprint}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
