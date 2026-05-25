/**
 * DocuGob — Server-side fetch of the tenant's most-recent documents.
 *
 * Used by the dashboard home so the user lands on a "continue where
 * you left off" view — drafts + recently generated docs visible in
 * the initial HTML, no client roundtrip.
 *
 * Returns the most recently updated `limit` documents (mix of drafts
 * and generated). Empty array on any error to keep the home render
 * defensive.
 */

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

import { ACCESS_COOKIE } from "./auth-cookies";
import { FASTAPI_V1, type FastapiEnvelope } from "./fastapi";
import type {
  DocumentListItem,
  PaginatedResponse,
} from "@/lib/api/types";

export const getRecentDocumentsServer = cache(
  async (limit: number = 5): Promise<DocumentListItem[]> => {
    const jar = await cookies();
    const access = jar.get(ACCESS_COOKIE)?.value;
    if (!access) return [];

    let res: Response;
    try {
      res = await fetch(
        `${FASTAPI_V1}/documents?page=1&page_size=${limit}`,
        {
          headers: { authorization: `Bearer ${access}` },
          cache: "no-store",
        }
      );
    } catch {
      return [];
    }

    if (!res.ok) return [];

    try {
      const envelope = (await res.json()) as FastapiEnvelope<
        PaginatedResponse<DocumentListItem>
      >;
      if (!envelope.success || !envelope.data) return [];
      return envelope.data.items;
    } catch {
      return [];
    }
  }
);
