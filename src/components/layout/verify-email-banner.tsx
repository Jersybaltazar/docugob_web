"use client";

import { useState } from "react";
import { MailWarning, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import {
  useCurrentUser,
  useResendEmailVerification,
} from "@/hooks/auth/use-auth";

export function VerifyEmailBanner() {
  const { data: user } = useCurrentUser();
  const resend = useResendEmailVerification();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.is_verified || dismissed) return null;

  const handleResend = async () => {
    try {
      await resend.mutateAsync();
      toast({
        title: "Te reenviamos el enlace",
        description: `Revisa la bandeja de ${user.email}.`,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo reenviar el enlace";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <MailWarning aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 leading-snug">
        <span className="font-medium">Verifica tu correo. </span>
        Te enviamos un enlace a <strong>{user.email}</strong> para confirmar
        tu cuenta. Si no lo encuentras, revisa la carpeta de spam.
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
        disabled={resend.isPending}
        onClick={handleResend}
      >
        {resend.isPending ? "Enviando..." : "Reenviar enlace"}
      </Button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Ocultar aviso"
        className="rounded p-1 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
