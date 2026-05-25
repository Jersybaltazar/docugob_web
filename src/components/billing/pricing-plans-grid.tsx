"use client";

/**
 * DocuGob — Pricing plans grid (client island).
 *
 * Sprint D — the surrounding `/pricing` page is a Server Component
 * that ships pricing copy + plans data in the initial HTML. This
 * island owns the interactive parts: the "Suscribirse" button that
 * opens the checkout dialog, and the selected-plan state.
 */

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PlanCard } from "@/components/billing/plan-card";
import { CheckoutDialog } from "@/components/billing/checkout-dialog";
import type { PlanInfo, PlanListResponse } from "@/lib/api/types";

type Props = {
  plansResponse: PlanListResponse;
  isAuthed: boolean;
  currentPlanCode: string;
};

export function PricingPlansGrid({
  plansResponse,
  isAuthed,
  currentPlanCode,
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {plansResponse.plans.map((plan) => {
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

      <CheckoutDialog
        plan={selectedPlan}
        open={Boolean(selectedPlan)}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
        provider={plansResponse.provider}
        publicKey={plansResponse.public_key}
      />
    </>
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
