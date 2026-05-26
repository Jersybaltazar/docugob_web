"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { useConfirmEmailVerification } from "@/hooks/auth/use-auth";

type State =
  | { status: "pending" }
  | { status: "ok" }
  | { status: "error"; message: string };

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const confirm = useConfirmEmailVerification();
  const [state, setState] = useState<State>(() =>
    token
      ? { status: "pending" }
      : { status: "error", message: "El enlace no es válido." },
  );
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    confirm
      .mutateAsync({ token })
      .then(() => setState({ status: "ok" }))
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : "No se pudo verificar el correo";
        setState({ status: "error", message });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state.status === "pending") {
    return (
      <div className="space-y-4 text-center">
        <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Verificando tu correo...
        </h1>
        <p className="text-sm text-muted-foreground">
          Esto solo tomará un momento.
        </p>
      </div>
    );
  }

  if (state.status === "ok") {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Correo verificado
          </h1>
          <p className="text-sm text-muted-foreground">
            ¡Listo! Tu correo electrónico fue confirmado correctamente.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard">Ir al panel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <XCircle className="mx-auto size-12 text-destructive" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          No pudimos verificar tu correo
        </h1>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/dashboard">Ir al panel</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/sign-in">Volver a iniciar sesión</Link>
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-muted-foreground">Cargando…</div>}
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
