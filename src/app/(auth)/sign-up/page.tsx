"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FormGenerator } from "@/components/forms/form-generator";
import { useSignUpForm } from "@/hooks/auth/use-sign-up";
import type { SignUpValues } from "@/schemas/auth.schema";

export default function SignUpPage() {
  const { register, errors, onHandleSubmit, loading } = useSignUpForm();

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Crea tu cuenta gratuita
        </h1>
        <p className="text-sm text-muted-foreground">
          Hasta 5 documentos al mes sin tarjeta de crédito
        </p>
      </div>

      <form noValidate onSubmit={onHandleSubmit} className="space-y-4">
        <FormGenerator<SignUpValues>
          inputType="input"
          name="full_name"
          label="Nombre completo"
          autoComplete="name"
          placeholder="Ej: María García López"
          autoFocus
          register={register}
          errors={errors}
        />

        <FormGenerator<SignUpValues>
          inputType="input"
          name="tenant_name"
          label="Nombre de la entidad"
          autoComplete="organization"
          placeholder="Ej: Red de Salud Huánuco"
          register={register}
          errors={errors}
        />

        <FormGenerator<SignUpValues>
          inputType="input"
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="usuario@entidad.gob.pe"
          register={register}
          errors={errors}
        />

        <FormGenerator<SignUpValues>
          inputType="input"
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          description="Mínimo 8 caracteres con mayúscula, minúscula, dígito y símbolo."
          register={register}
          errors={errors}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta gratuita"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
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
