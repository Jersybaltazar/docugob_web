/**
 * DocuGob — Team / invitation API surface (browser).
 *
 * All endpoints under `/team/*` are authenticated (the proxy injects
 * the bearer token from the HttpOnly cookie automatically). The
 * public preview/accept routes live under `/auth/invitations/*`.
 */

import { api } from "./client";
import type {
  Invitation,
  InvitationPreview,
  TeamMember,
  TenantRole,
} from "./types";

type AuthAck = { ok: boolean };

export const teamApi = {
  // --- Tenant-scoped (auth required) ---

  listMembers(): Promise<TeamMember[]> {
    return api.get<TeamMember[]>("/team/members");
  },

  listInvitations(): Promise<Invitation[]> {
    return api.get<Invitation[]>("/team/invitations");
  },

  createInvitation(params: {
    email: string;
    role: TenantRole;
    area?: string | null;
  }): Promise<Invitation> {
    return api.post<Invitation>("/team/invitations", params);
  },

  cancelInvitation(invitationId: string): Promise<AuthAck> {
    return api.delete<AuthAck>(`/team/invitations/${invitationId}`);
  },

  // --- Public (no auth required) ---

  previewInvitation(token: string): Promise<InvitationPreview> {
    return api.get<InvitationPreview>(`/auth/invitations/${token}`);
  },

  /**
   * Accept calls a Next.js route handler that swaps tokens for cookies
   * server-side, so the browser never sees the JWTs (same shape as
   * /api/auth/login). Returns a `{ logged_in: true }` ack on success.
   */
  acceptInvitation(
    token: string,
    params: { full_name?: string; password?: string } = {},
  ): Promise<{ logged_in: boolean }> {
    return api.post<{ logged_in: boolean }>("/auth/accept-invitation", {
      token,
      ...params,
    });
  },
};
