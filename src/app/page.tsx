import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  ImageIcon,
  Layers,
  ShieldCheck,
  Sparkles,
  Stamp,
  Upload,
  Workflow,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { DOCUMENT_CATEGORIES } from "@/lib/document-types";

/**
 * DocuGob — Marketing landing.
 *
 * Sections (in scroll order):
 *  - Header / nav
 *  - Hero with primary CTA
 *  - Trust strip (logos / law refs)
 *  - 3 core value props
 *  - How it works (4 steps mirroring the wizard)
 *  - Categories grid (6 families covering 30 templates)
 *  - Custom templates feature (upload your .docx with your letterhead)
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
        <DocumentCategoriesSection />
        <CustomTemplatesSection />
        <PricingTeaserSection />
        <FinalCtaSection />
      </main>

      <SiteFooter />
    </div>
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
          30 plantillas oficiales · asistente IA en español · tu propio membrete
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
          30 documentos al mes gratis · sin tarjeta de crédito · cancela cuando
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
// Value props — 3 features that close the deal
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
          icon={<Layers className="h-5 w-5" />}
          title="30 plantillas oficiales"
          description="Oficios, memorandos, informes, resoluciones, solicitudes, actas, constancias y más — organizadas en 6 categorías, todas con los formatos exigidos por la Ley N° 27444."
        />
        <ValueCard
          icon={<ImageIcon className="h-5 w-5" />}
          title="Tu propio membrete"
          description="Sube tu .docx con la cabecera y pie de página de tu entidad. DocuGob rellena el contenido y respeta tu identidad institucional al pie de la letra."
        />
        <ValueCard
          icon={<Sparkles className="h-5 w-5" />}
          title="IA + numeración automática"
          description="Asistente IA en español formal que redacta el cuerpo. Numeración correlativa por área y año sin duplicados, lista para auditoría."
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
// How it works — 4-step wizard
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
            description="30 plantillas en 6 categorías. Filtrá por uso, encontrá la que necesitás."
          />
          <Step
            number={2}
            title="Completa los datos"
            description="Destinatario, asunto, referencias. El formulario se adapta al tipo de documento."
          />
          <Step
            number={3}
            title="Deja que la IA redacte"
            description="El asistente genera el cuerpo en español formal. Editás, ajustás el tono y listo."
          />
          <Step
            number={4}
            title="Vista previa y descarga"
            description="Mirá el PDF real (no una aproximación) antes de generar. Después descargás .docx y .pdf."
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
// Document categories — 6 buckets covering 30 templates
// ---------------------------------------------------------------------------

function DocumentCategoriesSection() {
  return (
    <section
      id="documentos"
      aria-labelledby="documentos-title"
      className="mx-auto max-w-5xl px-6 py-20"
    >
      <header className="text-center">
        <h2 id="documentos-title" className="text-3xl font-semibold tracking-tight">
          30 plantillas en 6 categorías
        </h2>
        <p className="mt-3 text-muted-foreground">
          Catálogo basado en directivas reales del MEF, MINSA, gobiernos
          regionales y municipalidades del Perú.
        </p>
      </header>

      <div
        className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {DOCUMENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.code}
              role="listitem"
              className="flex items-start gap-3 rounded-lg border bg-card p-4"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Resoluciones, oficios circulares, actas, hojas de ruta, solicitudes
        Ley 27806, certificados y muchas más.{" "}
        <Link href="/sign-up" className="font-medium text-primary underline-offset-2 hover:underline">
          Ver el catálogo completo
        </Link>
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Custom templates — flagship Sprint 8 feature
// ---------------------------------------------------------------------------

function CustomTemplatesSection() {
  return (
    <section
      id="personalizacion"
      aria-labelledby="personalizacion-title"
      className="border-y bg-muted/30 py-20"
    >
      <div className="mx-auto max-w-5xl px-6">
        <header className="text-center">
          <h2
            id="personalizacion-title"
            className="text-3xl font-semibold tracking-tight"
          >
            Tus plantillas, tu identidad institucional
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Sube tu propio archivo Word con el membrete oficial, los logos y el
            pie de página de tu entidad. DocuGob rellena solo el contenido —
            tu formato queda intacto.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Left: How it works */}
          <div className="space-y-4">
            <FeaturePoint
              icon={<Upload className="h-4 w-4" />}
              title="Subes tu .docx"
              description="El mismo archivo Word que ya usas en tu entidad — con sus logos, dirección y pie de página."
            />
            <FeaturePoint
              icon={<Stamp className="h-4 w-4" />}
              title="Marcas dónde va el contenido"
              description={
                <>
                  Pegás placeholders simples como{" "}
                  <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px] ring-1 ring-border">
                    {"{{ cuerpo }}"}
                  </code>{" "}
                  o{" "}
                  <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px] ring-1 ring-border">
                    {"{{ destinatario_nombre }}"}
                  </code>{" "}
                  donde quieras que DocuGob rellene.
                </>
              }
            />
            <FeaturePoint
              icon={<Eye className="h-4 w-4" />}
              title="Vista previa fiel antes de generar"
              description="Ves el PDF real del documento — con tu membrete, tu pie, tu cuerpo redactado — antes de comprometerte con un número correlativo."
            />
            <FeaturePoint
              icon={<Sparkles className="h-4 w-4" />}
              title="La IA respeta tu estilo"
              description="El asistente genera contenido en español formal pero tu identidad visual es tuya. Cero plantillas genéricas."
            />
          </div>

          {/* Right: Visual mock of a document with letterhead */}
          <div className="rounded-xl border bg-background p-6 shadow-sm">
            <div className="rounded-md border bg-white p-4 text-neutral-900 dark:bg-neutral-100">
              {/* Mock letterhead */}
              <div className="flex items-start gap-3 border-b pb-3">
                <div className="grid h-12 w-12 place-items-center rounded bg-gradient-to-br from-emerald-400 to-yellow-400 text-[10px] font-bold text-white">
                  GR
                </div>
                <div className="min-w-0 flex-1 text-[10px] uppercase tracking-wide">
                  <p className="font-semibold leading-tight">
                    UNIDAD EJECUTORA 405
                  </p>
                  <p className="leading-tight">RED DE SALUD HUAMALIES</p>
                  <p className="mt-0.5 normal-case text-[9px] text-neutral-500">
                    Jr. 28 de Julio N° 260 — Llata
                  </p>
                </div>
                <div className="grid h-12 w-10 place-items-center rounded bg-neutral-900 text-[7px] font-bold leading-tight text-white">
                  HCO
                  <br />
                  CDR
                </div>
              </div>

              {/* Mock body */}
              <div className="space-y-2 py-4 text-[9px]">
                <p className="text-center font-semibold underline">
                  INFORME N° 001-2026-RSH/SISE
                </p>
                <div className="mt-3 space-y-1.5">
                  <div>
                    <span className="font-semibold">A : </span>
                    <span className="rounded bg-amber-100 px-1 ring-1 ring-amber-200">
                      {"{{ destinatario_cargo }}"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">ASUNTO : </span>
                    <span className="rounded bg-amber-100 px-1 ring-1 ring-amber-200">
                      {"{{ asunto }}"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">FECHA : </span>
                    <span className="rounded bg-amber-100 px-1 ring-1 ring-amber-200">
                      {"{{ ciudad }}, {{ fecha }}"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 rounded bg-amber-100 p-2 ring-1 ring-amber-200">
                  <span className="font-mono">{"{{ cuerpo }}"}</span>
                  <span className="text-[8px] text-neutral-500">
                    {" "}
                    ← lo redacta la IA
                  </span>
                </div>
              </div>

              {/* Mock footer */}
              <div className="border-t pt-2 text-center text-[8px] italic text-neutral-500">
                www.rishuamalies.gob.pe · 983152902 — SECRETARIA
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Las zonas en amarillo se rellenan automáticamente. El resto
              de tu Word queda exactamente igual.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/sign-up">
              Probar con mi plantilla
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeaturePoint({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-background p-4 ring-1 ring-border">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
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
        <Bullet>30 documentos al mes en el plan Gratuito</Bullet>
        <Bullet>Documentos ilimitados desde S/19.90/mes</Bullet>
        <Bullet>Sin marca de agua desde Pro</Bullet>
        <Bullet>Plantillas con tu membrete en Institucional</Bullet>
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
