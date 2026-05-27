"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { teamApi } from "@/lib/api/team";
import type { TenantRole } from "@/lib/api/types";

const MEMBERS_QUERY_KEY = ["team", "members"] as const;
const INVITATIONS_QUERY_KEY = ["team", "invitations"] as const;

export function useTeamMembers() {
  return useQuery({
    queryKey: MEMBERS_QUERY_KEY,
    queryFn: () => teamApi.listMembers(),
    staleTime: 30_000,
  });
}

export function useTeamInvitations() {
  return useQuery({
    queryKey: INVITATIONS_QUERY_KEY,
    queryFn: () => teamApi.listInvitations(),
    staleTime: 30_000,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      email: string;
      role: TenantRole;
      area?: string | null;
    }) => teamApi.createInvitation(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      teamApi.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });
    },
  });
}

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: ["invitation-preview", token] as const,
    queryFn: () => teamApi.previewInvitation(token),
    enabled: token.length > 0,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (params: {
      token: string;
      full_name?: string;
      password?: string;
    }) =>
      teamApi.acceptInvitation(params.token, {
        full_name: params.full_name,
        password: params.password,
      }),
  });
}
