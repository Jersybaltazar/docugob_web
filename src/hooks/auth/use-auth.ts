"use client";

/**
 * DocuGob — Auth hooks (browser).
 *
 * Sprint C — tokens live in HttpOnly cookies set by `/api/auth/*`
 * route handlers, not in localStorage. The hooks here only orchestrate
 * the TanStack Query cache + the navigation side-effects.
 *
 * `useCurrentUser` is the source of truth for "am I logged in?": it
 * hits `/api/auth/me`, which returns 401 when the session is missing
 * or expired (and the proxy has already attempted a silent refresh).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { UserWithTenant } from "@/lib/api/types";

const USER_QUERY_KEY = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery<UserWithTenant | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        // A 401 means no session — return null instead of throwing so
        // consumers can branch on `data === null` cleanly.
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      authApi.login(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (params: {
      email: string;
      password: string;
      full_name: string;
      tenant_name: string;
    }) => authApi.register(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort: even if the call fails, blow away the local
      // cache so the next /api/auth/me round-trip reflects reality.
    }
    queryClient.setQueryData(USER_QUERY_KEY, null);
    queryClient.removeQueries();
    router.push("/sign-in");
  };
}
