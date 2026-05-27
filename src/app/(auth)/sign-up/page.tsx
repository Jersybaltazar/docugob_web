"use client";

import Link from "next/link";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormGenerator } from "@/components/forms/form-generator";
import { useSignUpForm } from "@/hooks/auth/use-sign-up";
import type { SignUpValues } from "@/schemas/auth.schema";

export default function SignUpPage() {
  const { register, control, errors, onHandleSubmit, loading } =
    useSignUpForm();

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Crea tu cuenta gratuita
        </h1>
        <p className="text-sm text-muted-foreground">
          Hasta 30 documentos al mes sin tarjeta de crédito
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
          inputType="password"
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          description="Mínimo 8 caracteres con mayúscula, minúscula, dígito y símbolo."
          register={register}
          errors={errors}
        />

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Controller
              control={control}
              name="accept_terms"
              render={({ field }) => (
                <Checkbox
                  id="accept_terms"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.accept_terms)}
                  className="mt-0.5"
                />
              )}
            />
            {/* Plain <label> instead of shadcn's <Label> — the latter
                applies `flex items-center gap-2`, which turns every
                child (including the inline <Link>s) into a separate
                flex column, fragmenting the sentence. */}
            <label
              htmlFor="accept_terms"
              className="select-none text-sm leading-snug text-muted-foreground"
            >
              He leído y acepto los{" "}
              <Link
                href="/terminos"
                target="_blank"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacidad"
                target="_blank"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Política de privacidad
              </Link>
              .
            </label>
          </div>
          {errors.accept_terms && (
            <p role="alert" className="text-sm text-destructive">
              {errors.accept_terms.message}
            </p>
          )}
        </div>

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
