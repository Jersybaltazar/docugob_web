"use client";

/**
 * DocuGob — Public pricing page.
 *
 * Anyone can visit; the CTAs adapt depending on auth state:
 *  - Unauthenticated: "Comenzar gratis" → /sign-up
 *  - Authenticated free: "Suscribirse" opens the checkout dialog
 *  - Authenticated paid: "Plan actual" badge on the matching card
 */

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "@/components/billing/plan-card";
import { CheckoutDialog } from "@/components/billing/checkout-dialog";

import { useCurrentUser } from "@/hooks/use-auth";
import { usePlans } from "@/hooks/use-billing";
import type { PlanInfo } from "@/lib/api/types";

export default function PricingPage() {
  const plans = usePlans();
  // /users/me already carries the active tenant plan, so we don't hit
  // /billing/subscription on the public page (which would 401 for
  // anonymous visitors and clutter the network tab).
  const { data: user } = useCurrentUser();

  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);

  const isAuthed = Boolean(user);
  const currentPlanCode = (user?.current_tenant?.plan ?? "free").toLowerCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            DocuGob
          </Link>
          <nav className="flex items-center gap-2">
            {isAuthed ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Ir al panel</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Crear cuenta</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Un plan para cada entidad pública del Perú
          </h1>
          <p className="mt-4 text-muted-foreground">
            Empieza gratis. Súbete al plan Profesional cuando necesites más
            documentos o branding propio. Cancelas cuando quieras.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          {plans.isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          ) : plans.isError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
              No se pudieron cargar los planes. Asegúrate de que la API esté
              corriendo y refresca la página.
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
                      <PricingCta
                        plan={p}
                        isAuthed={isAuthed}
                        isCurrent={isCurrent}
                        onSelect={() => setSelectedPlan(p)}
                      />
                    )}
                  />
                );
              })}
            </div>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Precios en soles peruanos (S/) sin IGV. Procesado por{" "}
            {plans.data?.provider === "mock"
              ? "Mock (dev)"
              : plans.data?.provider ?? "Culqi"}{" "}
            · Métodos: tarjetas Visa/Mastercard.
          </p>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} DocuGob</p>
          <Link href="/" className="hover:text-foreground">
            ← Volver al inicio
          </Link>
        </div>
      </footer>

      {plans.data && (
        <CheckoutDialog
          plan={selectedPlan}
          open={Boolean(selectedPlan)}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
          provider={plans.data.provider}
          publicKey={plans.data.public_key}
        />
      )}
    </div>
  );
}

function PricingCta({
  plan,
  isAuthed,
  isCurrent,
  onSelect,
}: {
  plan: PlanInfo;
  isAuthed: boolean;
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
      <Button asChild className="w-full" variant="outline">
        <Link href={isAuthed ? "/dashboard" : "/sign-up"}>
          {isAuthed ? "Ir al panel" : "Comenzar gratis"}
        </Link>
      </Button>
    );
  }
  if (!isAuthed) {
    return (
      <Button asChild className="w-full">
        <Link
          href={`/sign-up?next=${encodeURIComponent(
            `/pricing?plan=${plan.code}`
          )}`}
        >
          Crear cuenta y suscribirse
        </Link>
      </Button>
    );
  }
  return (
    <Button className="w-full" onClick={onSelect}>
      Suscribirse al plan {plan.name}
    </Button>
  );
}
