"use client";

/**
 * DocuGob — Dashboard topbar.
 *
 * Holds the sidebar toggle, the command-palette shortcut hint, and the
 * user menu (avatar + dropdown with profile + logout).
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
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { LogOut, Search, User } from "lucide-react";
import Link from "next/link";

function initialsFor(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Topbar() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <button
        type="button"
        // Triggers the same ⌘K dialog without reaching for the keyboard;
        // we dispatch a synthetic Ctrl+K keydown to keep a single source
        // of truth for the open/close logic.
        onClick={() =>
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
          )
        }
        className="flex flex-1 items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 transition-colors max-w-md"
        aria-label="Abrir paleta de comandos"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar o ejecutar acción...</span>
        <kbd className="ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {user?.current_tenant && (
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
                <AvatarFallback>{initialsFor(user?.full_name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.full_name ?? "Usuario"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email ?? "—"}
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
