"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useCurrentUser } from "@/hooks/use-auth";
import { tokenStorage } from "@/lib/auth/storage";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  // Client-side redirect: the middleware already guards on the cookie,
  // but localStorage lives only in the browser, so we double-check here.
  useEffect(() => {
    if (!tokenStorage.isAuthenticated()) {
      router.replace("/sign-in");
    }
  }, [router]);

  // While the /users/me query resolves, render a minimal shell so the
  // sidebar/topbar don't flash with empty user info.
  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Cargando tu cuenta…
      </div>
    );
  }

  if (user === null) {
    // The hook will have triggered storage.clear(); router.replace runs
    // in the effect above.
    return null;
  }

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
        <Topbar />
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
