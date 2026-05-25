"use client";

/**
 * DocuGob — Dashboard topbar.
 *
 * Holds the sidebar toggle, the command-palette shortcut hint, and the
 * user menu (avatar + dropdown with profile + logout).
 *
 * Sprint D — the RSC layout passes the initial `user` as a prop so the
 * topbar renders the correct name/plan in the very first paint. We
 * still subscribe to `useCurrentUser()` so the topbar updates after a
 * profile change without a hard refresh, falling back to the prop
 * while the query data is `undefined`.
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCurrentUser, useLogout } from "@/hooks/auth/use-auth";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import type { UserWithTenant } from "@/lib/api/types";

function initialsFor(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Topbar({ user: initialUser }: { user: UserWithTenant }) {
  // Prefer the (potentially updated) query cache; fall back to the SSR
  // snapshot so we never show a placeholder while React Query warms up.
  const { data: queryUser } = useCurrentUser();
  const user = queryUser ?? initialUser;
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Cmd+K command palette stays available via global keyboard
          shortcut bound in <CommandPalette />. We removed the visible
          "Buscar o ejecutar acción..." button because the dedicated
          search lives inside /dashboard/documents, and most non-tech
          users never used the palette. Power users still hit ⌘K. */}

      <div className="ml-auto flex items-center gap-2">
        {user.current_tenant && (
          <span
            className="hidden sm:inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs font-medium"
            title={`Plan ${user.current_tenant.plan}`}
          >
            <span className="capitalize">{user.current_tenant.plan}</span>
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Menú de usuario"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initialsFor(user.full_name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.full_name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <User className="mr-2 h-4 w-4" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
