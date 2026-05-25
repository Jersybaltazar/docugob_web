"use client";

/**
 * DocuGob — Dashboard shell (Sprint D).
 *
 * The RSC layout passes the freshly-fetched `user` here so the topbar
 * renders with the correct name / plan immediately, without any
 * intermediate spinner. The shell owns the bits that need client
 * interactivity: the `SidebarProvider` context and the command palette.
 */

import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import type { UserWithTenant } from "@/lib/api/types";

export function DashboardShell({
  user,
  children,
}: {
  user: UserWithTenant;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Keyboard skip link (WCAG 2.4.1). Hidden until focused. */}
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido principal
      </a>
      <AppSidebar />
      <SidebarInset>
        <Topbar user={user} />
        <main
          id="dashboard-main"
          tabIndex={-1}
          className="flex-1 px-6 py-6 lg:px-8 focus:outline-none"
        >
          {children}
        </main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
