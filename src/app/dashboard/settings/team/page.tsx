"use client";

/**
 * DocuGob — /dashboard/settings/team
 *
 * OWNER/ADMIN-only management of the tenant's team. Available on
 * Institucional and (a single seat) on Free/Pro.
 *
 * Three blocks:
 *   1. Active members — read-only roster.
 *   2. Pending invitations — cancel before they're accepted.
 *   3. Invite dialog — email + role (+ optional area).
 *
 * Quota errors from the API (PlanLimitExceededError) surface inside
 * the dialog so the user knows when to upgrade.
 */

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Mail,
  MailWarning,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Loader2,
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
import { Skeleton } from "@/components/ui/skeleton";
import { FormGenerator } from "@/components/forms/form-generator";
import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { format } from "@/lib/format";
import { useCurrentUser } from "@/hooks/auth/use-auth";
import {
  useCancelInvitation,
  useCreateInvitation,
  useTeamInvitations,
  useTeamMembers,
} from "@/hooks/team/use-team";
import type { TenantRole } from "@/lib/api/types";

// ---------------------------------------------------------------------------
// Invite form schema
// ---------------------------------------------------------------------------

const inviteSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  role: z.enum(["admin", "editor", "viewer"]),
  area: z.string().max(100, "Demasiado largo").optional(),
});
type InviteValues = z.infer<typeof inviteSchema>;

const ROLE_LABELS: Record<TenantRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Lector",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamPage() {
  const { data: user } = useCurrentUser();
  const members = useTeamMembers();
  const invitations = useTeamInvitations();
  const [inviteOpen, setInviteOpen] = useState(false);

  const currentRole = (user?.current_role ?? "").toLowerCase();
  const canManage = currentRole === "owner" || currentRole === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/settings">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a configuración
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Equipo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Personas con acceso a {user?.current_tenant?.name ?? "tu entidad"}.
              Cada miembro tiene su cuenta y rol propio.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-1 h-4 w-4" />
              Invitar usuario
            </Button>
          )}
        </div>
      </header>

      {!canManage && (
        <div className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Solo el propietario o un administrador pueden invitar nuevos
          miembros. Estás viendo el equipo en modo lectura.
        </div>
      )}

      {/* ----- Active members ---------------------------------------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Miembros activos
            {members.data && (
              <span className="text-sm font-normal text-muted-foreground">
                ({members.data.length})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Usuarios con membresía activa en esta entidad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.isLoading ? (
            <Skeleton className="h-14" />
          ) : (members.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay miembros activos.
            </p>
          ) : (
            (members.data ?? []).map((m) => (
              <div
                key={m.user_id}
                className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-3 py-2.5"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.full_name || m.email}
                    {m.is_current_user && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        (tú)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.area ? ` · ${m.area}` : ""} · desde{" "}
                    {format.dateShort(m.joined_at)}
                  </p>
                </div>
                <Badge
                  variant={m.is_owner ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {ROLE_LABELS[m.role as TenantRole] ?? m.role}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ----- Pending invitations ----------------------------------- */}
      {canManage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MailWarning className="h-4 w-4 text-primary" />
              Invitaciones pendientes
              {invitations.data && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({invitations.data.length})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Las invitaciones caducan a los 7 días. Cancélalas cuando ya no
              apliquen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.isLoading ? (
              <Skeleton className="h-14" />
            ) : (invitations.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tienes invitaciones pendientes.
              </p>
            ) : (
              (invitations.data ?? []).map((inv) => (
                <PendingInvitationRow key={inv.id} invitation={inv} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending row
// ---------------------------------------------------------------------------

function PendingInvitationRow({
  invitation,
}: {
  invitation: {
    id: string;
    email: string;
    role: string;
    expires_at: string;
    created_at: string;
  };
}) {
  const cancel = useCancelInvitation();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-3 py-2.5">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
        <Mail className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{invitation.email}</p>
        <p className="truncate text-xs text-muted-foreground">
          Invitada como{" "}
          {ROLE_LABELS[invitation.role as TenantRole] ?? invitation.role} · caduca{" "}
          {format.dateShort(invitation.expires_at)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirm(true)}
        className="text-destructive hover:text-destructive"
        disabled={cancel.isPending}
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        Cancelar
      </Button>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar invitación</DialogTitle>
            <DialogDescription>
              La invitación a{" "}
              <span className="font-medium">{invitation.email}</span> dejará
              de ser válida y el enlace que enviamos no podrá usarse. Puedes
              volver a invitarle más adelante.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirm(false)}
              disabled={cancel.isPending}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancel.mutate(invitation.id, {
                  onSuccess: () => {
                    setConfirm(false);
                    toast({
                      title: "Invitación cancelada",
                      description: invitation.email,
                    });
                  },
                  onError: (err) => {
                    const message =
                      err instanceof ApiError
                        ? err.message
                        : "No se pudo cancelar la invitación";
                    toast({
                      title: "Error",
                      description: message,
                      variant: "destructive",
                    });
                  },
                })
              }
              disabled={cancel.isPending}
            >
              {cancel.isPending && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              Cancelar invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite dialog
// ---------------------------------------------------------------------------

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const create = useCreateInvitation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "editor", area: "" },
    mode: "onChange",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        email: values.email,
        role: values.role,
        area: values.area?.trim() ? values.area.trim() : null,
      });
      toast({
        title: "Invitación enviada",
        description: `Le mandamos un correo a ${values.email}.`,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo enviar la invitación";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>
            Le enviaremos un correo con un enlace para unirse a la entidad y
            crear su contraseña.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="space-y-4 pt-2">
          <FormGenerator<InviteValues>
            inputType="input"
            name="email"
            label="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="colaborador@entidad.gob.pe"
            register={register}
            errors={errors}
          />
          <FormGenerator<InviteValues>
            inputType="select"
            name="role"
            label="Rol en la entidad"
            options={[
              { value: "admin", label: "Administrador — gestiona equipo y plantillas" },
              { value: "editor", label: "Editor — crea y genera documentos" },
              { value: "viewer", label: "Lector — solo lectura" },
            ]}
            register={register}
            errors={errors}
          />
          <FormGenerator<InviteValues>
            inputType="input"
            name="area"
            label="Área u oficina (opcional)"
            placeholder="Ej: Logística, RR.HH., Asesoría Jurídica"
            register={register}
            errors={errors}
            description="Aparece en los documentos generados por esta persona."
          />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || create.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || create.isPending}
            >
              {create.isPending && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
