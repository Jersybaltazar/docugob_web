"use client";

/**
 * DocuGob — Plan checkout dialog.
 *
 * Two flavors depending on the backend provider:
 *   • `mock`   — renders an inline test-card form so the wizard works
 *                end-to-end without internet. Picks between a valid
 *                token (`mock_tkn_OK_*`) and a declined token
 *                (`mock_tkn_DECLINED`).
 *   • `culqi`  — lazily loads Culqi.js, opens the official Checkout v4
 *                modal, and forwards the tokenized card to the backend.
 *
 * The parent passes `provider` + `publicKey` from /billing/plans so
 * this component never has to know which environment it's in.
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useSubscribe } from "@/hooks/use-billing";
import { ApiError } from "@/lib/api/client";
import { useCurrentUser } from "@/hooks/use-auth";
import { format } from "@/lib/format";
import { loadCulqi } from "./culqi-loader";
import type { PlanInfo } from "@/lib/api/types";

type Props = {
  plan: PlanInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: string;
  publicKey: string;
  onSuccess?: () => void;
};

export function CheckoutDialog({
  plan,
  open,
  onOpenChange,
  provider,
  publicKey,
  onSuccess,
}: Props) {
  const { data: user } = useCurrentUser();
  const subscribe = useSubscribe();
  const isMock = provider === "mock";

  const close = () => {
    if (subscribe.isPending) return;
    onOpenChange(false);
  };

  const handleSubscribe = async (token: string) => {
    if (!plan) return;
    if (plan.code !== "pro" && plan.code !== "institutional") {
      toast.error("Solo los planes pagos pueden suscribirse");
      return;
    }
    try {
      await subscribe.mutateAsync({
        plan_code: plan.code as "pro" | "institutional",
        card_token: token,
      });
      toast.success(`Suscrito al plan ${plan.name}`);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "No se pudo procesar el pago";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Suscribirse al plan {plan?.name ?? ""}
          </DialogTitle>
          <DialogDescription>
            {plan
              ? `Cargo recurrente mensual de ${format.cents(plan.price_cents)} en ${plan.currency}.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {isMock ? (
          <MockForm
            plan={plan}
            onPay={handleSubscribe}
            disabled={subscribe.isPending}
          />
        ) : (
          <CulqiForm
            plan={plan}
            publicKey={publicKey}
            payerEmail={user?.email ?? ""}
            onToken={handleSubscribe}
            disabled={subscribe.isPending}
          />
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cancelas cuando quieras desde tu panel.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={close}
            disabled={subscribe.isPending}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Mock provider — inline test cards
// ---------------------------------------------------------------------------

function MockForm({
  plan,
  onPay,
  disabled,
}: {
  plan: PlanInfo | null;
  onPay: (token: string) => void;
  disabled: boolean;
}) {
  const [scenario, setScenario] = useState<"ok" | "declined">("ok");

  const submit = () => {
    const token =
      scenario === "ok"
        ? `mock_tkn_OK_${Math.random().toString(36).slice(2, 8)}`
        : "mock_tkn_DECLINED";
    onPay(token);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <p className="font-medium">Modo de prueba (proveedor: Mock)</p>
        <p>
          No se necesita una tarjeta real. Configura{" "}
          <code className="font-mono">CULQI_SECRET_KEY</code> en el backend para
          activar el flujo real con Culqi.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mock-scenario">Simulación de tarjeta</Label>
        <Select
          value={scenario}
          onValueChange={(v) => setScenario(v as "ok" | "declined")}
        >
          <SelectTrigger id="mock-scenario">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ok">Tarjeta válida — la suscripción se activa</SelectItem>
            <SelectItem value="declined">Tarjeta rechazada — error simulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        className="w-full"
        onClick={submit}
        disabled={disabled || !plan}
      >
        {disabled && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
        <CreditCard className="mr-1 h-4 w-4" />
        Pagar {plan ? format.cents(plan.price_cents) : ""}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Real Culqi Checkout v4
// ---------------------------------------------------------------------------

function CulqiForm({
  plan,
  publicKey,
  payerEmail,
  onToken,
  disabled,
}: {
  plan: PlanInfo | null;
  publicKey: string;
  payerEmail: string;
  onToken: (token: string) => void;
  disabled: boolean;
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-warm the Culqi.js cache so the first click feels snappy.
    if (publicKey) {
      loadCulqi().catch(() => {
        // Network/CSP errors surface on click — silently swallow here.
      });
    }
  }, [publicKey]);

  const openCheckout = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      await loadCulqi();
      if (typeof window === "undefined" || !window.Culqi) {
        throw new Error("Culqi.js no se pudo inicializar");
      }
      const Culqi = window.Culqi;
      Culqi.publicKey = publicKey;
      Culqi.settings({
        title: `DocuGob ${plan.name}`,
        currency: plan.currency,
        amount: plan.price_cents,
      });
      Culqi.options?.({
        lang: "auto",
        installments: false,
        paymentMethods: { tarjeta: true, yape: false, billetera: false, bancaMovil: false, agente: false, cuotealo: false },
        customerEmail: payerEmail || "",
      });

      // Culqi calls a globally named function `culqi` after a successful
      // tokenization. We install/uninstall it for the duration of the
      // open modal.
      window.culqi = () => {
        const tokenObj = window.Culqi?.token;
        const errorObj = window.Culqi?.error;
        if (tokenObj?.id) {
          onToken(tokenObj.id);
        } else if (errorObj) {
          toast.error(errorObj.user_message ?? "Pago rechazado");
        }
        try {
          window.Culqi?.close?.();
        } catch {
          // ignore
        }
      };

      Culqi.open();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar el proceso de pago"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 px-3 py-3 text-xs space-y-1">
        <p className="font-medium">Pago seguro con Culqi</p>
        <p className="text-muted-foreground">
          Tu tarjeta no pasa por nuestros servidores. Culqi se encarga de la
          tokenización y el procesamiento bajo estándares PCI DSS.
        </p>
      </div>

      <Button
        type="button"
        className="w-full"
        onClick={openCheckout}
        disabled={disabled || loading || !plan || !publicKey}
      >
        {(disabled || loading) && (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        )}
        <CreditCard className="mr-1 h-4 w-4" />
        Continuar al pago de {plan ? format.cents(plan.price_cents) : ""}
      </Button>
    </div>
  );
}
