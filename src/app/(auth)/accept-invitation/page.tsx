"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormGenerator } from "@/components/forms/form-generator";
import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { passwordSchema } from "@/schemas/auth.schema";
import {
  useAcceptInvitation,
  useInvitationPreview,
} from "@/hooks/team/use-team";
import { useCurrentUser } from "@/hooks/auth/use-auth";
import type { TenantRole } from "@/lib/api/types";

const ROLE_LABELS: Record<TenantRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Lector",
};

const newUserSchema = z.object({
  full_name: z.string().min(2, "Ingresa tu nombre completo").max(255),
  password: passwordSchema,
});
type NewUserValues = z.infer<typeof newUserSchema>;

function AcceptInvitationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const preview = useInvitationPreview(token);
  const { data: currentUser } = useCurrentUser();
  const accept = useAcceptInvitation();
  const [done, setDone] = useState(false);

  const newUserForm = useForm<NewUserValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { full_name: "", password: "" },
    mode: "onChange",
  });

  // ---- Empty / invalid token ---------------------------------------
  if (!token) {
    return (
      <ErrorView
        title="Enlace inválido"
        description="El enlace de invitación está incompleto. Pídele a quien te invitó que te lo reenvíe."
      />
    );
  }

  // ---- Loading preview ---------------------------------------------
  if (preview.isLoading) {
    return (
      <div className="space-y-4 text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" />
        <h1 className="text-xl font-semibold tracking-tight">
          Validando invitación…
        </h1>
      </div>
    );
  }

  // ---- Preview failed (expired / used / invalid) -------------------
  if (preview.isError || !preview.data) {
    const message =
      preview.error instanceof ApiError
        ? preview.error.message
        : "La invitación no es válida o ya caducó.";
    return <ErrorView title="No pudimos validar la invitación" description={message} />;
  }

  const inv = preview.data;
  const roleLabel =
    ROLE_LABELS[inv.role as TenantRole] ?? inv.role;

  // ---- Done — auto redirect ----------------------------------------
  if (done) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            ¡Bienvenido a {inv.tenant_name}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Te estamos llevando al panel…
          </p>
        </div>
      </div>
    );
  }

  // ---- Flow A: user already signed in ------------------------------
  if (currentUser) {
    const emailMatches = currentUser.email.toLowerCase() === inv.email.toLowerCase();

    if (!emailMatches) {
      return (
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Esta invitación es para otra cuenta
            </h1>
            <p className="text-sm text-muted-foreground">
              La invitación está dirigida a{" "}
              <span className="font-medium text-foreground">{inv.email}</span>,
              pero estás iniciado como{" "}
              <span className="font-medium text-foreground">
                {currentUser.email}
              </span>
              . Cierra sesión e inicia con la cuenta correcta.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">Ir al panel</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <InvitationHeader
          tenantName={inv.tenant_name}
          inviterName={inv.inviter_name}
          roleLabel={roleLabel}
          email={inv.email}
        />
        <Button
          className="w-full"
          disabled={accept.isPending}
          onClick={() => acceptAndRedirect()}
        >
          {accept.isPending && (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          )}
          Aceptar invitación
        </Button>
      </div>
    );
  }

  // ---- Flow B: requires login (email already has an account) -------
  if (inv.requires_login) {
    return (
      <div className="space-y-6">
        <InvitationHeader
          tenantName={inv.tenant_name}
          inviterName={inv.inviter_name}
          roleLabel={roleLabel}
          email={inv.email}
        />
        <div className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Este correo ya tiene una cuenta en DocuGob. Inicia sesión con esa
          cuenta y vuelve a este enlace para aceptar.
        </div>
        <Button asChild className="w-full">
          <Link
            href={`/sign-in?next=${encodeURIComponent(
              `/accept-invitation?token=${token}`,
            )}`}
          >
            Iniciar sesión
          </Link>
        </Button>
      </div>
    );
  }

  // ---- Flow C: anonymous, brand-new user ---------------------------
  return (
    <div className="space-y-6">
      <InvitationHeader
        tenantName={inv.tenant_name}
        inviterName={inv.inviter_name}
        roleLabel={roleLabel}
        email={inv.email}
      />
      <p className="text-sm text-muted-foreground">
        Crea tu contraseña para aceptar la invitación. Tu cuenta queda
        verificada automáticamente.
      </p>
      <form
        noValidate
        onSubmit={newUserForm.handleSubmit(async (values) => {
          await acceptAndRedirect({
            full_name: values.full_name,
            password: values.password,
          });
        })}
        className="space-y-4"
      >
        <FormGenerator<NewUserValues>
          inputType="input"
          name="full_name"
          label="Nombre completo"
          autoComplete="name"
          placeholder="Ej: María García López"
          autoFocus
          register={newUserForm.register}
          errors={newUserForm.formState.errors}
        />
        <FormGenerator<NewUserValues>
          inputType="password"
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          description="Mínimo 8 caracteres con mayúscula, minúscula, dígito y símbolo."
          register={newUserForm.register}
          errors={newUserForm.formState.errors}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={newUserForm.formState.isSubmitting || accept.isPending}
        >
          {accept.isPending && (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          )}
          Aceptar y entrar
        </Button>
      </form>
    </div>
  );

  async function acceptAndRedirect(
    extra: { full_name?: string; password?: string } = {},
  ) {
    try {
      await accept.mutateAsync({ token, ...extra });
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No pudimos aceptar la invitación";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }
}

function InvitationHeader({
  tenantName,
  inviterName,
  roleLabel,
  email,
}: {
  tenantName: string;
  inviterName: string | null;
  roleLabel: string;
  email: string;
}) {
  return (
    <div className="space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Te invitaron a {tenantName}
      </h1>
      <p className="text-sm text-muted-foreground">
        {inviterName ? `${inviterName} te invitó` : "Te invitaron"} a unirte
        como <span className="font-medium text-foreground">{roleLabel}</span>.
      </p>
      <p className="text-xs text-muted-foreground">
        Correo de la invitación:{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>
    </div>
  );
}

function ErrorView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6 text-center">
      <XCircle className="mx-auto size-12 text-destructive" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link href="/sign-in">Volver a iniciar sesión</Link>
      </Button>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-muted-foreground">Cargando…</div>}
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
