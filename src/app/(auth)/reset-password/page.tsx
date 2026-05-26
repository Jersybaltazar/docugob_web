"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormGenerator } from "@/components/forms/form-generator";
import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { useConfirmPasswordReset } from "@/hooks/auth/use-auth";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/schemas/auth.schema";

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const confirmReset = useConfirmPasswordReset();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirm: "" },
    mode: "onChange",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await confirmReset.mutateAsync({
        token,
        password: values.password,
      });
      setDone(true);
      toast({
        title: "Contraseña actualizada",
        description: "Ya puedes iniciar sesión con tu nueva contraseña.",
      });
      setTimeout(() => router.push("/sign-in"), 1500);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo restablecer la contraseña";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Enlace inválido
          </h1>
          <p className="text-sm text-muted-foreground">
            El enlace de recuperación no es válido o está incompleto.
            Solicita uno nuevo desde la pantalla de inicio de sesión.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Solicitar nuevo enlace</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          ¡Listo!
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu contraseña fue actualizada. Te llevaremos al inicio de sesión.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Crea tu nueva contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Elige una contraseña segura. La usarás para iniciar sesión.
        </p>
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormGenerator<ResetPasswordValues>
          inputType="password"
          name="password"
          label="Nueva contraseña"
          autoComplete="new-password"
          autoFocus
          description="Mínimo 8 caracteres con mayúscula, minúscula, dígito y símbolo."
          register={register}
          errors={errors}
        />
        <FormGenerator<ResetPasswordValues>
          inputType="password"
          name="password_confirm"
          label="Confirmar contraseña"
          autoComplete="new-password"
          register={register}
          errors={errors}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || confirmReset.isPending}
        >
          {confirmReset.isPending ? "Guardando..." : "Restablecer contraseña"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
