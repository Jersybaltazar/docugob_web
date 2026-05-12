"use client";

/**
 * DocuGob — Main application sidebar.
 *
 * Built on shadcn's `Sidebar` block. The set of links matches the
 * features actually shipped today; commented-out items are coming in
 * Sprints 2-5 of the frontend track and surface here once their pages
 * exist.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Home,
  Plus,
  Settings,
  CreditCard,
  Files,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/documents", label: "Mis documentos", icon: Files },
  { href: "/dashboard/templates", label: "Plantillas", icon: FileText },
];

const ACCOUNT_ITEMS = [
  { href: "/dashboard/billing", label: "Plan y facturación", icon: CreditCard },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 text-base font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </span>
          DocuGob
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/documents/new" className="font-medium">
                    <Plus />
                    <span>Crear documento</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Trabajo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ACCOUNT_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-muted-foreground">
          Conforme a la Ley N° 27444
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
