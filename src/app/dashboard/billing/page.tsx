"use client";

/**
 * DocuGob — /dashboard/billing
 *
 * Shows the tenant's current plan + subscription state, and lets them
 * upgrade or cancel. Highlights:
 *  - "Tu plan actual" card with status, next billing, payment provider
 *  - The 3 plan cards from the public catalog with contextual CTAs
 *  - Cancel flow with confirm dialog (since it drops the tenant to FREE)
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PlanCard } from "@/components/billing/plan-card";
import { CheckoutDialog } from "@/components/billing/checkout-dialog";

import { useCurrentUser } from "@/hooks/use-auth";
import {
  useCancelSubscription,
  usePlans,
  useSubscription,
} from "@/hooks/use-billing";
import { format } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import type { PlanInfo } from "@/lib/api/types";

export default function BillingPage() {
  const { data: user } = useCurrentUser();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const plans = usePlans();
  const cancel = useCancelSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const currentPlanCode = (
    user?.current_tenant?.plan ??
    subscription?.plan ??
    "free"
  ).toLowerCase();

  const currentPlan = useMemo(
    () =>
      (plans.data?.plans ?? []).find((p) => p.code === currentPlanCode) ?? null,
    [plans.data, currentPlanCode]
  );

  const isFreePlan = currentPlanCode === "free";
  const isCancelled =
    (subscription?.status ?? "").toLowerCase() === "cancelled";

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast.success("Suscripción cancelada. Tu cuenta pasó al plan Gratuito.");
      setConfirmCancel(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo cancelar la suscripción";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Plan y facturación
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra tu suscripción y cambia de plan cuando lo necesites.
        </p>
      </header>

      {/* Current subscription overview */}
      <section className="rounded-lg border bg-card p-6">
        {subLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-lg font-semibold">
                  Plan {currentPlan?.name ?? "Gratuito"}
                </h2>
                <SubscriptionStatusBadge status={subscription?.status} />
                {currentPlan && currentPlan.price_cents > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {format.cents(currentPlan.price_cents)} / mes
                  </span>
                )}
              </div>

              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 max-w-xl">
                <Field
                  label="Proveedor de pago"
                  value={
                    subscription?.payment_provider
                      ? labelProvider(subscription.payment_provider)
                      : "—"
                  }
                />
                <Field
                  label="Próximo cobro"
                  value={
                    isFreePlan
                      ? "—"
                      : subscription?.current_period_end
                      ? format.dateLong(subscription.current_period_end)
                      : "—"
                  }
                />
                <Field
                  label="Inicio del período actual"
                  value={
                    subscription?.current_period_start
                      ? format.dateLong(subscription.current_period_start)
                      : "—"
                  }
                />
                <Field
                  label="ID de suscripción"
                  value={subscription?.external_subscription_id ?? "—"}
                />
              </dl>

              {isCancelled && (
                <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Tu suscripción está cancelada. Estás en el plan Gratuito —
                  hasta 5 documentos al mes con marca de agua. Suscríbete de
                  nuevo para recuperar el acceso ilimitado.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {isFreePlan ? (
                <Button asChild>
                  <a href="#planes">Ver planes pagos</a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setConfirmCancel(true)}
                  disabled={cancel.isPending}
                >
                  Cancelar suscripción
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Plans grid */}
      <section id="planes" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Cambiar de plan</h2>
          <p className="text-sm text-muted-foreground">
            Sube a Pro para generar documentos ilimitados y eliminar la marca de
            agua, o pasa a Institucional cuando necesites varios usuarios y
            branding propio.
          </p>
        </div>
        {plans.isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {(plans.data?.plans ?? []).map((plan) => {
              const isCurrent = plan.code === currentPlanCode;
              const highlight = plan.code === "pro";
              return (
                <PlanCard
                  key={plan.code}
                  plan={plan}
                  highlighted={highlight}
                  badge={
                    isCurrent
                      ? "Plan actual"
                      : highlight
                      ? "Recomendado"
                      : undefined
                  }
                  renderCta={(p) => (
                    <BillingCta
                      plan={p}
                      isCurrent={isCurrent}
                      onSelect={() => setSelectedPlan(p)}
                    />
                  )}
                />
              );
            })}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        ¿Necesitas factura electrónica o un plan personalizado para tu
        institución?{" "}
        <Link href="/" className="underline-offset-2 hover:underline">
          Contáctanos
        </Link>
        .
      </p>

      {plans.data && (
        <CheckoutDialog
          plan={selectedPlan}
          open={Boolean(selectedPlan)}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
          provider={plans.data.provider}
          publicKey={plans.data.public_key}
        />
      )}

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar suscripción</DialogTitle>
            <DialogDescription>
              Tu cuenta pasará inmediatamente al plan Gratuito: hasta 5
              documentos al mes y marca de agua. Los documentos generados se
              conservan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmCancel(false)}
              disabled={cancel.isPending}
            >
              Mantener mi plan
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancel.isPending}
            >
              {cancel.isPending && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              Sí, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-medium truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}

function SubscriptionStatusBadge({
  status,
}: {
  status?: string | null;
}) {
  if (!status) return null;
  const normalized = status.toLowerCase();
  if (normalized === "active") {
    return <Badge>Activa</Badge>;
  }
  if (normalized === "past_due") {
    return <Badge variant="destructive">Pago pendiente</Badge>;
  }
  if (normalized === "cancelled" || normalized === "canceled") {
    return <Badge variant="outline">Cancelada</Badge>;
  }
  if (normalized === "trialing") {
    return <Badge variant="secondary">Prueba</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

function labelProvider(code: string): string {
  switch (code.toLowerCase()) {
    case "culqi":
      return "Culqi";
    case "mercado_pago":
      return "Mercado Pago";
    case "mock":
      return "Mock (dev)";
    default:
      return code;
  }
}

function BillingCta({
  plan,
  isCurrent,
  onSelect,
}: {
  plan: PlanInfo;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  if (isCurrent) {
    return (
      <Button disabled className="w-full" variant="outline">
        Plan actual
      </Button>
    );
  }
  if (plan.code === "free") {
    return (
      <Button disabled className="w-full" variant="outline">
        Disponible al cancelar tu plan
      </Button>
    );
  }
  return (
    <Button className="w-full" onClick={onSelect}>
      Pasar al plan {plan.name}
    </Button>
  );
}
