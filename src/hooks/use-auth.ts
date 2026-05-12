"use client";

/**
 * DocuGob — Auth hooks.
 *
 * - useCurrentUser(): cache /users/me with React Query.
 * - useLogin() / useRegister() / useLogout(): mutations that persist
 *   the JWT pair via `tokenStorage` and invalidate the user query.
 *
 * The hooks never throw on a missing token; consumers should read
 * `data` and `isLoading` and route accordingly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import type { UserWithTenant } from "@/lib/api/types";
import { tokenStorage } from "@/lib/auth/storage";

const USER_QUERY_KEY = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery<UserWithTenant | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      if (!tokenStorage.isAuthenticated()) return null;
      try {
        return await authApi.me();
      } catch {
        tokenStorage.clear();
        return null;
      }
    },
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      authApi.login(params),
    onSuccess: (tokens) => {
      tokenStorage.set(tokens.access_token, tokens.refresh_token);
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
    onSuccess: (tokens) => {
      tokenStorage.set(tokens.access_token, tokens.refresh_token);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return () => {
    tokenStorage.clear();
    queryClient.setQueryData(USER_QUERY_KEY, null);
    queryClient.removeQueries();
    router.push("/sign-in");
  };
}
