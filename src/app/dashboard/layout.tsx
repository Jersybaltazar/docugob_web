/**
 * DocuGob — Dashboard layout (Server Component).
 *
 * AUDIT §3.1 — the chrome (sidebar, topbar, providers) is rendered
 * server-side from the freshly-read `user`. No client spinner before
 * we know who the visitor is.
 *
 * Flow:
 *   1. `requireCurrentUser()` reads the HttpOnly access cookie and
 *      calls FastAPI /users/me. If the access JWT is stale but the
 *      refresh cookie is still valid, it transparently bounces
 *      through /api/auth/refresh-redirect to rotate the tokens and
 *      come back here.
 *   2. If no valid session at all, redirect to /sign-in.
 *   3. Otherwise render `<AuthHydrator>` (seeds the TanStack cache so
 *      child Client Components don't re-fetch) + `<DashboardShell>`.
 */

import { AuthHydrator } from "@/components/providers/auth-hydrator";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireCurrentUser } from "@/lib/server/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser("/dashboard");

  return (
    <>
      <AuthHydrator user={user} />
      <DashboardShell user={user}>{children}</DashboardShell>
    </>
  );
}
