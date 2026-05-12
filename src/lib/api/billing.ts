/**
 * DocuGob — Billing API.
 *
 * Mirrors the FastAPI `/billing/*` endpoints from Sprint 5 backend:
 *   GET  /billing/plans          — public catalog
 *   GET  /billing/subscription   — current tenant's sub
 *   POST /billing/subscribe      — upgrade FREE → paid plan
 *   POST /billing/cancel         — drop back to FREE
 */

import { api } from "./client";
import type {
  PlanListResponse,
  SubscriptionRead,
} from "./types";

export type SubscribePayload = {
  plan_code: "pro" | "institutional";
  card_token: string;
};

export const billingApi = {
  plans(): Promise<PlanListResponse> {
    // The endpoint is open; we pass skipAuth so unauthenticated visits
    // to /pricing don't trip the JWT refresh flow.
    return api.get<PlanListResponse>("/billing/plans", { skipAuth: true });
  },

  subscription(): Promise<SubscriptionRead | null> {
    return api.get<SubscriptionRead | null>("/billing/subscription");
  },

  subscribe(payload: SubscribePayload): Promise<SubscriptionRead> {
    return api.post<SubscriptionRead>("/billing/subscribe", payload);
  },

  cancel(): Promise<SubscriptionRead> {
    return api.post<SubscriptionRead>("/billing/cancel");
  },
};
