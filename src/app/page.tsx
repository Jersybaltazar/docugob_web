import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  FileText,
  Mail,
  Mails,
  ShieldCheck,
  Sparkles,
  Stamp,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * DocuGob — Marketing landing.
 *
 * Sections (in scroll order):
 *  - Header / nav
 *  - Hero with primary CTA
 *  - Trust strip (logos / law refs)
 *  - 3 core value props
 *  - How it works (4 steps mirroring the wizard)
 *  - Document types grid (the 8 normados)
 *  - Use cases by role
 *  - Pricing teaser
 *  - Final CTA
 *  - Footer with legal references
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip link for keyboard users (WCAG 2.4.1) */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido principal
      </a>

      <SiteHeader />

      <main id="main" className="flex-1">
        <HeroSection />
        <TrustStrip />
        <ValuePropsSection />
        <HowItWorksSection />
        <DocumentTypesSection />
        <UseCasesSection />
        <PricingTeaserSection />
        <FinalCtaSection />
      </main>

      <SiteFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header / Footer
// ---------------------------------------------------------------------------

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
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
            <Link href="#caracteristicas">Características</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="#documentos">Documentos</Link>
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

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-[2fr_1fr_1fr]">
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
              { href: "#documentos", label: "Tipos de documento" },
              { href: "#como-funciona", label: "Cómo funciona" },
            ]}
          />
          <FooterColumn
            title="Cuenta"
            links={[
              { href: "/sign-in", label: "Iniciar sesión" },
              { href: "/sign-up", label: "Crear cuenta gratis" },
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

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
    >
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          Asistente IA en español incluido — primer documento en 2 minutos
        </p>
        <h1
          id="hero-title"
          className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl"
        >
          Genera oficios, memorandos e informes oficiales en minutos.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          DocuGob automatiza la redacción y numeración de documentos
          administrativos para entidades del sector público peruano. Sigue al
          pie de la letra el TUO de la Ley N° 27444 y entrega tu primer oficio
          formateado, firmable y con número correlativo en menos de 2 minutos.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-w-[200px]">
            <Link href="/sign-up">
              Crear cuenta gratis
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[200px]">
            <Link href="/pricing">Ver planes</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          5 documentos al mes gratis · sin tarjeta de crédito · cancela cuando
          quieras
        </p>
      </div>

      {/* Decorative gradient — purely visual */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-b from-primary/5 to-transparent"
      />
    </section>
  );
}

function TrustStrip() {
  return (
    <section
      aria-label="Cumplimiento normativo"
      className="border-y bg-muted/30 py-6"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 text-xs text-muted-foreground">
        <Badge>
          <ShieldCheck className="h-3.5 w-3.5" />
          TUO Ley N° 27444
        </Badge>
        <Badge>
          <BadgeCheck className="h-3.5 w-3.5" />
          Directiva 001-2023-MPCH/A
        </Badge>
        <Badge>
          <ShieldCheck className="h-3.5 w-3.5" />
          Ley N° 29733 (RNPDP)
        </Badge>
        <Badge>
          <Workflow className="h-3.5 w-3.5" />
          Manual MEF RM 439-2018-EF/41
        </Badge>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 font-medium ring-1 ring-border">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Value props
// ---------------------------------------------------------------------------

function ValuePropsSection() {
  return (
    <section
      id="caracteristicas"
      aria-labelledby="caracteristicas-title"
      className="mx-auto max-w-5xl px-6 py-20"
    >
      <header className="text-center">
        <h2 id="caracteristicas-title" className="text-3xl font-semibold tracking-tight">
          Diseñado para secretarias, asistentes y jefaturas
        </h2>
        <p className="mt-3 text-muted-foreground">
          Lo familiar de Word, la velocidad de un asistente experto.
        </p>
      </header>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <ValueCard
          icon={<FileText className="h-5 w-5" />}
          title="8 tipos normados"
          description="Oficios simples y múltiples, memorandos, informes ordinarios y técnicos, cartas, constancias y proveídos con los formatos oficiales."
        />
        <ValueCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Asistente IA en español formal"
          description="Redacta el cuerpo del documento por ti, con tono institucional, fórmulas de cortesía correctas y atajos &quot;Más formal&quot; o &quot;Más conciso&quot;."
        />
        <ValueCard
          icon={<Stamp className="h-5 w-5" />}
          title="Numeración automática"
          description="Secuencia correlativa por área, año y tipo de documento. Sin duplicados, sin errores manuales, listo para auditoría."
        />
      </div>
    </section>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border bg-card p-6">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="border-y bg-muted/30 py-20"
    >
      <div className="mx-auto max-w-5xl px-6">
        <header className="text-center">
          <h2
            id="como-funciona-title"
            className="text-3xl font-semibold tracking-tight"
          >
            Tu próximo oficio en cuatro pasos
          </h2>
          <p className="mt-3 text-muted-foreground">
            El asistente te guía paso a paso. Sin pelearte con plantillas Word.
          </p>
        </header>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            number={1}
            title="Elige el tipo"
            description="Oficio simple, memorando, informe… Selecciona la plantilla que se ajusta a tu trámite."
          />
          <Step
            number={2}
            title="Completa los datos"
            description="Destinatario, asunto, referencias. El formulario se adapta al tipo de documento."
          />
          <Step
            number={3}
            title="Deja que la IA redacte"
            description="El asistente genera el cuerpo en español formal. Editas, ajustas el tono y listo."
          />
          <Step
            number={4}
            title="Descarga y firma"
            description="Archivo .docx y .pdf listos para imprimir, sellar y firmar."
          />
        </ol>
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <li className="rounded-xl bg-background p-6 ring-1 ring-border">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {number}
      </span>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Document types
// ---------------------------------------------------------------------------

function DocumentTypesSection() {
  return (
    <section
      id="documentos"
      aria-labelledby="documentos-title"
      className="mx-auto max-w-5xl px-6 py-20"
    >
      <header className="text-center">
        <h2 id="documentos-title" className="text-3xl font-semibold tracking-tight">
          Los 8 tipos de documento incluidos
        </h2>
        <p className="mt-3 text-muted-foreground">
          Catálogo basado en directivas reales del MEF, MINSA y municipalidades
          peruanas. Sprint a sprint sumamos más.
        </p>
      </header>

      <div
        className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        role="list"
      >
        {[
          { icon: Mail, label: "Oficio Simple" },
          { icon: Mails, label: "Oficio Múltiple" },
          { icon: FileText, label: "Memorando" },
          { icon: FileText, label: "Informe Ordinario" },
          { icon: FileText, label: "Informe Técnico" },
          { icon: Mail, label: "Carta Institucional" },
          { icon: BadgeCheck, label: "Constancia" },
          { icon: ArrowRight, label: "Proveído" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            role="listitem"
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Use cases
// ---------------------------------------------------------------------------

function UseCasesSection() {
  return (
    <section
      aria-labelledby="usuarios-title"
      className="border-y bg-muted/30 py-20"
    >
      <div className="mx-auto max-w-5xl px-6">
        <header className="text-center">
          <h2 id="usuarios-title" className="text-3xl font-semibold tracking-tight">
            Hecho para tu día a día
          </h2>
        </header>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <UseCase
            icon={<Users className="h-5 w-5" />}
            role="Secretaria(o) administrativa(o)"
            quote="Reduzco el tiempo de armar un oficio de 30 minutos a 2. La numeración correlativa por área la lleva la plataforma."
          />
          <UseCase
            icon={<Building2 className="h-5 w-5" />}
            role="Jefatura de área"
            quote="Apruebo y firmo más rápido porque los documentos llegan ya con el formato oficial y la fundamentación correcta."
          />
          <UseCase
            icon={<ShieldCheck className="h-5 w-5" />}
            role="Asesoría jurídica"
            quote="El asistente cita las normas que le indico, nunca inventa expedientes y marca con [FALTA:...] cualquier dato ausente."
          />
        </div>
      </div>
    </section>
  );
}

function UseCase({
  icon,
  role,
  quote,
}: {
  icon: React.ReactNode;
  role: string;
  quote: string;
}) {
  return (
    <article className="rounded-xl bg-background p-6 ring-1 ring-border">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {role}
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        &laquo;{quote}&raquo;
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Pricing teaser
// ---------------------------------------------------------------------------

function PricingTeaserSection() {
  return (
    <section
      aria-labelledby="precios-teaser-title"
      className="mx-auto max-w-4xl px-6 py-20 text-center"
    >
      <h2 id="precios-teaser-title" className="text-3xl font-semibold tracking-tight">
        Empieza gratis. Sube cuando lo necesites.
      </h2>
      <p className="mt-4 text-muted-foreground">
        Plan Gratuito para siempre. Plan Profesional desde S/19.90 al mes.
        Plan Institucional para tu entidad con hasta 10 usuarios.
      </p>

      <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
        <Bullet>5 documentos al mes en el plan Gratuito</Bullet>
        <Bullet>Documentos ilimitados desde S/19.90/mes</Bullet>
        <Bullet>Sin marca de agua desde Pro</Bullet>
        <Bullet>Cancelas cuando quieras</Bullet>
      </ul>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/pricing">
            Ver comparativa de planes
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/sign-up">Probar gratis</Link>
        </Button>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 rounded-md border bg-card px-4 py-3 text-sm">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

function FinalCtaSection() {
  return (
    <section
      aria-labelledby="cta-final-title"
      className="bg-primary text-primary-foreground"
    >
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 id="cta-final-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tu próximo oficio está a un clic.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
          Crea tu cuenta gratis y genera tu primer documento oficial en 2
          minutos. Sin tarjeta de crédito.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="secondary" className="min-w-[200px]">
            <Link href="/sign-up">
              <Zap className="mr-1.5 h-4 w-4" />
              Empezar gratis
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-w-[200px] border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link href="/pricing">Ver planes</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
