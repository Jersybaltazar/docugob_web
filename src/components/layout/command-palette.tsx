"use client";

/**
 * DocuGob — Command palette (⌘K / Ctrl+K).
 *
 * Sprint 8 — Fase 2: groups the "Crear documento" entries by category
 * so 30 options stay scannable. Coming-soon types are hidden from
 * the palette (the wizard surfaces them with a "Próximamente" badge,
 * but in the palette they'd just be dead ends).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FilePlus,
  Files,
  CreditCard,
  Settings,
  Home,
  FileText,
} from "lucide-react";

import {
  DOCUMENT_CATEGORIES,
  documentTypesByCategory,
} from "@/lib/document-types";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Bind ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const grouped = documentTypesByCategory();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Escribe un comando o búsqueda..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        {DOCUMENT_CATEGORIES.map((cat) => {
          const specs = grouped[cat.code].filter((s) => !s.comingSoon);
          if (specs.length === 0) return null;
          return (
            <CommandGroup key={cat.code} heading={`Crear · ${cat.label}`}>
              {specs.map((doc) => {
                const Icon = doc.icon;
                return (
                  <CommandItem
                    key={doc.code}
                    value={`crear ${doc.label} ${doc.description}`}
                    onSelect={() =>
                      go(`/dashboard/documents/new?type=${doc.code}`)
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {doc.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}

        <CommandSeparator />

        <CommandGroup heading="Ir a">
          <CommandItem onSelect={() => go("/dashboard")}>
            <Home className="mr-2 h-4 w-4" />
            Inicio
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/documents")}>
            <Files className="mr-2 h-4 w-4" />
            Mis documentos
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/templates")}>
            <FileText className="mr-2 h-4 w-4" />
            Plantillas
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/documents/new")}>
            <FilePlus className="mr-2 h-4 w-4" />
            Asistente de creación
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/billing")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Plan y facturación
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
