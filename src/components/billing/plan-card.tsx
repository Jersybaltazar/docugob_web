"use client";

/**
 * DocuGob — Plan card.
 *
 * Reusable in both `/pricing` (public) and `/dashboard/billing` (authed).
 * The CTA is delegated to the parent via `renderCta` so each context
 * can wire its own behavior (sign-up vs checkout vs noop).
 */

import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "@/lib/format";
import type { PlanInfo } from "@/lib/api/types";

export type PlanCardProps = {
  plan: PlanInfo;
  highlighted?: boolean;
  badge?: string;
  renderCta?: (plan: PlanInfo) => React.ReactNode;
  className?: string;
};

export function PlanCard({
  plan,
  highlighted,
  badge,
  renderCta,
  className,
}: PlanCardProps) {
  const isFree = plan.code === "free";

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-6",
        highlighted && "border-primary ring-2 ring-primary/30 shadow-lg",
        className
      )}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
          <Star className="h-3 w-3" />
          {badge}
        </span>
      )}

      <header>
        <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground min-h-[2.5rem]">
          {plan.tagline}
        </p>
      </header>

      <div className="mt-6 flex items-baseline gap-1">
        {isFree ? (
          <span className="text-3xl font-semibold">Gratis</span>
        ) : (
          <>
            <span className="text-3xl font-semibold tracking-tight">
              {format.cents(plan.price_cents)}
            </span>
            <span className="text-sm text-muted-foreground">/mes</span>
          </>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.quotas && (
        <dl className="mt-6 grid grid-cols-2 gap-3 border-t pt-4 text-xs">
          <Quota
            label="Documentos/mes"
            value={
              plan.quotas.max_documents_per_month < 0
                ? "Ilimitados"
                : String(plan.quotas.max_documents_per_month)
            }
          />
          <Quota label="Usuarios" value={String(plan.quotas.max_users)} />
          <Quota
            label="IA por hora"
            value={String(plan.quotas.ai_requests_per_hour)}
          />
          <Quota
            label="Marca de agua"
            value={plan.quotas.watermark ? "Incluida" : "Sin marca"}
          />
        </dl>
      )}

      {renderCta && <div className="mt-6">{renderCta(plan)}</div>}
    </article>
  );
}

function Quota({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
