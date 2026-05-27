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
import { toast } from "@/components/ui/use-toast";
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

import { Check } from "lucide-react";

import { CheckoutDialog } from "@/components/billing/checkout-dialog";

import { useCurrentUser } from "@/hooks/auth/use-auth";
import {
  useCancelSubscription,
  usePlans,
  useSubscription,
} from "@/hooks/billing/use-billing";
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
      toast({
        title: "Éxito",
        description: "Suscripción cancelada. Tu cuenta pasó al plan Gratuito.",
      });
      setConfirmCancel(false);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo cancelar la suscripción";
      toast({ title: "Error", description: message, variant: "destructive" });
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
                  hasta 30 documentos al mes (los primeros 10 sin marca de
                  agua). Suscríbete de nuevo para recuperar el acceso
                  ilimitado y sin marca.
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

      {/* Other plans — compact comparison, only shows plans the user
          can actually switch to (the current plan is already in the
          card above; the free plan is reachable via "Cancelar"). */}
      {(() => {
        const switchablePlans = (plans.data?.plans ?? []).filter(
          (p) => p.code !== currentPlanCode && p.code !== "free"
        );
        if (plans.isLoading) {
          return (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Otros planes</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </section>
          );
        }
        if (switchablePlans.length === 0) return null;
        return (
          <section id="planes" className="space-y-3">
            <h2 className="text-lg font-semibold">Otros planes</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {switchablePlans.map((plan) => (
                <CompactPlanCard
                  key={plan.code}
                  plan={plan}
                  isUpgrade={
                    planRank(plan.code) > planRank(currentPlanCode)
                  }
                  onSelect={() => setSelectedPlan(plan)}
                />
              ))}
            </div>
          </section>
        );
      })()}

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
              Tu cuenta pasará inmediatamente al plan Gratuito: hasta 30
              documentos al mes (los primeros 10 sin marca de agua, los
              siguientes 20 con marca DocuGob). Los documentos que ya
              generaste se conservan.
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

// Plan hierarchy used to label a switch as "upgrade" vs "downgrade".
function planRank(code: string): number {
  switch (code.toLowerCase()) {
    case "free":
      return 0;
    case "pro":
      return 1;
    case "institutional":
      return 2;
    default:
      return -1;
  }
}

function CompactPlanCard({
  plan,
  isUpgrade,
  onSelect,
}: {
  plan: PlanInfo;
  isUpgrade: boolean;
  onSelect: () => void;
}) {
  // Pick the 3 most relevant features so the card stays compact.
  const features = plan.features.slice(0, 3);

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{plan.name}</h3>
          <p className="text-xs text-muted-foreground">{plan.tagline}</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="text-lg font-semibold">
            {format.cents(plan.price_cents)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">/mes</span>
        </p>
      </header>

      {features.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {features.map((feat) => (
            <li key={feat} className="flex items-start gap-2">
              <Check
                className="mt-0.5 h-3 w-3 shrink-0 text-primary"
                aria-hidden
              />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      )}

      <Button
        size="sm"
        variant={isUpgrade ? "default" : "outline"}
        className="mt-auto w-full"
        onClick={onSelect}
      >
        {isUpgrade ? `Pasar al plan ${plan.name}` : `Cambiar a ${plan.name}`}
      </Button>
    </article>
  );
}
