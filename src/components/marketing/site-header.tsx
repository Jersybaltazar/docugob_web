import Link from "next/link";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * DocuGob — Public site header.
 *
 * Server component shared by the marketing landing and the legal pages
 * (`/terminos`, `/privacidad`). Keeps the brand chrome consistent.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </span>
          DocuGob
        </Link>
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 sm:flex"
        >
          <Button asChild variant="ghost" size="sm">
            <Link href="/#caracteristicas">Características</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/#documentos">Documentos</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">Planes</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Crear cuenta gratis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
