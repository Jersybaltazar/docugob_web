"use client";

/**
 * DocuGob — Tenant templates cache hydrator.
 *
 * Same pattern as `AuthHydrator` — seed the TanStack cache with the
 * SSR-fetched list so `useMyTenantTemplates()` returns synchronously
 * on first render.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { tenantTemplatesKeys } from "@/hooks/tenant/use-tenant-templates";
import type { TemplateListItem } from "@/lib/api/types";

export function TenantTemplatesHydrator({
  templates,
}: {
  templates: TemplateListItem[];
}) {
  const queryClient = useQueryClient();
  useState(() => {
    queryClient.setQueryData(tenantTemplatesKeys.mine, templates);
    return null;
  });
  return null;
}
