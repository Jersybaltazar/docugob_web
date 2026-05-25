"use client";

/**
 * DocuGob — Auth cache hydrator (Sprint D).
 *
 * Server Components fetch the user via `getCurrentUserServer()`. The
 * dashboard's child pages still consume `useCurrentUser()` (a
 * TanStack Query hook). Without seeding the cache, those pages would
 * immediately refetch `/api/auth/me` on hydration, defeating the
 * point of the server fetch.
 *
 * This component runs the seed exactly once per mount via the
 * `useState` initializer trick — no `useEffect` (avoids cascading
 * renders) and no `setQueryData` on every render.
 */

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { UserWithTenant } from "@/lib/api/types";

const USER_QUERY_KEY = ["auth", "me"] as const;

export function AuthHydrator({ user }: { user: UserWithTenant }) {
  const queryClient = useQueryClient();
  useState(() => {
    queryClient.setQueryData(USER_QUERY_KEY, user);
    return null;
  });
  return null;
}
