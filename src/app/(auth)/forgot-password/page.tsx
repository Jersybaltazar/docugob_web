"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormGenerator } from "@/components/forms/form-generator";
import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { useRequestPasswordReset } from "@/hooks/auth/use-auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/schemas/auth.schema";

export default function ForgotPasswordPage() {
  const requestReset = useRequestPasswordReset();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onChange",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await requestReset.mutateAsync(values);
      setSent(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo enviar el enlace de recuperación";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Revisa tu correo
          </h1>
          <p className="text-sm text-muted-foreground">
            Si el correo está registrado, te enviamos un enlace para
            restablecer tu contraseña. El enlace caduca en 30 minutos.
          </p>
        </div>
        <Button asChild className="w-full" variant="outline">
          <Link href="/sign-in">Volver a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva.
        </p>
      </div>

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <FormGenerator<ForgotPasswordValues>
          inputType="input"
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="usuario@entidad.gob.pe"
          register={register}
          errors={errors}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || requestReset.isPending}
        >
          {requestReset.isPending ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Recordaste tu contraseña?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
