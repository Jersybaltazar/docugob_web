/**
 * DocuGob — Server-side fetch of the tenant's uploaded templates.
 *
 * Used by the settings page so the list is in the initial HTML and
 * the client form doesn't flash a loading state on first paint. See
 * AUDIT §3.2.
 */

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

import { ACCESS_COOKIE } from "./auth-cookies";
import { FASTAPI_V1, type FastapiEnvelope } from "./fastapi";
import type { TemplateListItem } from "@/lib/api/types";

export const getMyTenantTemplatesServer = cache(
  async (): Promise<TemplateListItem[]> => {
    const jar = await cookies();
    const access = jar.get(ACCESS_COOKIE)?.value;
    if (!access) return [];

    let res: Response;
    try {
      res = await fetch(`${FASTAPI_V1}/templates/tenant/mine`, {
        headers: { authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    } catch {
      return [];
    }

    if (!res.ok) return [];

    try {
      const envelope = (await res.json()) as FastapiEnvelope<
        TemplateListItem[]
      >;
      if (!envelope.success) return [];
      return envelope.data ?? [];
    } catch {
      return [];
    }
  }
);
