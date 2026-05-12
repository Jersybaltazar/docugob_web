"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useRegister } from "@/hooks/use-auth";

const schema = z.object({
  full_name: z
    .string()
    .min(2, "Ingresa tu nombre completo")
    .max(255, "Demasiado largo"),
  tenant_name: z
    .string()
    .min(2, "Ingresa el nombre de tu entidad")
    .max(255, "Demasiado largo"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", tenant_name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await register_.mutateAsync(values);
      toast.success("Cuenta creada — bienvenido a DocuGob");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo crear la cuenta";
      toast.error(message);
    }
  });

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

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Ej: María García López"
            autoFocus
            aria-invalid={!!errors.full_name}
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenant_name">Nombre de la entidad</Label>
          <Input
            id="tenant_name"
            autoComplete="organization"
            placeholder="Ej: Red de Salud Huánuco"
            aria-invalid={!!errors.tenant_name}
            {...register("tenant_name")}
          />
          {errors.tenant_name && (
            <p className="text-sm text-destructive">
              {errors.tenant_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="usuario@entidad.gob.pe"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres. Usa una combinación de letras y números.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || register_.isPending}
        >
          {isSubmitting || register_.isPending
            ? "Creando cuenta..."
            : "Crear cuenta gratuita"}
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
