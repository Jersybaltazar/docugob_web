import Link from "next/link";

/**
 * DocuGob — Public site footer.
 *
 * Server component shared by the marketing landing and the legal pages.
 * Owns the legal references (Ley 27444 / 29733) and links to /terminos
 * and /privacidad — required by Ley 29733 art. 18.
 */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="text-base font-semibold">DocuGob</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Automatización de documentos administrativos para el sector
              público peruano. Conforme al TUO de la Ley N° 27444 del
              Procedimiento Administrativo General.
            </p>
          </div>
          <FooterColumn
            title="Producto"
            links={[
              { href: "/pricing", label: "Planes y precios" },
              { href: "/#documentos", label: "Tipos de documento" },
              { href: "/#como-funciona", label: "Cómo funciona" },
              { href: "/#personalizacion", label: "Plantillas con tu membrete" },
            ]}
          />
          <FooterColumn
            title="Cuenta"
            links={[
              { href: "/sign-in", label: "Iniciar sesión" },
              { href: "/sign-up", label: "Crear cuenta gratis" },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { href: "/terminos", label: "Términos y condiciones" },
              { href: "/privacidad", label: "Política de privacidad" },
            ]}
          />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} DocuGob</p>
          <p>Hecho en Perú · Ley N° 27444 · Ley N° 29733 (Datos Personales)</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
