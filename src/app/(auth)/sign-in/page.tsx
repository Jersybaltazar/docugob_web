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
import { useLogin } from "@/hooks/use-auth";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      toast.success("Sesión iniciada");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo iniciar sesión";
      toast.error(message);
    }
  });

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

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="usuario@minsa.gob.pe"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            {/* Reset link placeholder — real flow lands in Sprint 9 */}
            <Link
              href="#"
              className="text-xs text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || login.isPending}>
          {isSubmitting || login.isPending ? "Ingresando..." : "Iniciar sesión"}
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
