"use client";

/**
 * DocuGob — Billing hooks.
 *
 * `usePlans()` is the public catalog (no auth needed); the rest are
 * tenant-scoped and invalidate the relevant queries so the dashboard
 * topbar's plan badge updates in lockstep with the subscription state.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billingApi, type SubscribePayload } from "@/lib/api/billing";

export const billingKeys = {
  plans: ["billing", "plans"] as const,
  subscription: ["billing", "subscription"] as const,
};

export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans,
    queryFn: () => billingApi.plans(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription,
    queryFn: () => billingApi.subscription(),
    staleTime: 30_000,
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubscribePayload) => billingApi.subscribe(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.subscription });
      // `me.current_tenant.plan` reflects the new plan after upgrade.
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.cancel(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.subscription });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
