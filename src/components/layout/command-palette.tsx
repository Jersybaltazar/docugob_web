"use client";

/**
 * DocuGob — Command palette (⌘K / Ctrl+K).
 *
 * TDR §7.2: "shadcn/ui blocks: dashboard con sidebar, command palette
 * (⌘K) para 'Nuevo oficio', 'Nuevo memorando'".
 *
 * The list of "Nuevo <tipo>" entries mirrors the 8 document types from
 * the backend catalog. Each one deep-links to the wizard preselected
 * with that type — the wizard page lands in Sprint 2 of the frontend.
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
  FileText,
  FilePlus,
  Files,
  CreditCard,
  Settings,
  Home,
} from "lucide-react";

type DocTypeShortcut = { type: string; label: string };

const DOC_TYPES: DocTypeShortcut[] = [
  { type: "oficio_simple", label: "Nuevo oficio simple" },
  { type: "oficio_multiple", label: "Nuevo oficio múltiple" },
  { type: "memorando", label: "Nuevo memorando" },
  { type: "informe_ordinario", label: "Nuevo informe ordinario" },
  { type: "informe_tecnico", label: "Nuevo informe técnico" },
  { type: "carta", label: "Nueva carta" },
  { type: "constancia", label: "Nueva constancia" },
  { type: "proveido", label: "Nuevo proveído" },
];

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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Escribe un comando o búsqueda..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Crear documento">
          {DOC_TYPES.map((doc) => (
            <CommandItem
              key={doc.type}
              onSelect={() => go(`/dashboard/documents/new?type=${doc.type}`)}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              {doc.label}
            </CommandItem>
          ))}
        </CommandGroup>

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
