/**
 * DocuGob — Server-side billing plans fetch (Sprint D).
 *
 * Used by `/pricing` so the RSC ships fully rendered cards in the
 * initial HTML — AUDIT §3.5: server-first data fetching beats
 * client-side spinners for SEO + perceived speed.
 *
 * The endpoint is public (no auth), so we hit FastAPI directly. If it
 * fails we return null and let the client render an empty state.
 */

import "server-only";
import { cache } from "react";

import { FASTAPI_V1, type FastapiEnvelope } from "./fastapi";
import type { PlanListResponse } from "@/lib/api/types";

export const getPlansServer = cache(
  async (): Promise<PlanListResponse | null> => {
    let res: Response;
    try {
      res = await fetch(`${FASTAPI_V1}/billing/plans`, {
        // 5-minute server-side cache; the catalog rarely changes and
        // the pricing page would otherwise hit FastAPI on every visit.
        next: { revalidate: 300 },
      });
    } catch {
      return null;
    }

    if (!res.ok) return null;
    try {
      const envelope = (await res.json()) as FastapiEnvelope<PlanListResponse>;
      if (!envelope.success || !envelope.data) return null;
      return envelope.data;
    } catch {
      return null;
    }
  }
);
