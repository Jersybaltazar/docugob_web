"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FormGenerator } from "@/components/forms/form-generator";
import { useSignInForm } from "@/hooks/auth/use-sign-in";
import type { SignInValues } from "@/schemas/auth.schema";

export default function SignInPage() {
  const { register, errors, onHandleSubmit, loading } = useSignInForm();

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Inicia sesión en DocuGob
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa tu correo institucional y contraseña
        </p>
      </div>

      <form noValidate onSubmit={onHandleSubmit} className="space-y-4">
        <FormGenerator<SignInValues>
          inputType="input"
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="usuario@minsa.gob.pe"
          register={register}
          errors={errors}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="sr-only" id="password-aux" />
            {/* Reset link placeholder — real flow lands in Sprint 9 */}
            <Link
              href="#"
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <FormGenerator<SignInValues>
            inputType="input"
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            register={register}
            errors={errors}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Crea una gratis
        </Link>
      </p>
    </div>
  );
}
