/**
 * DocuGob — Public pricing page (Server Component, Sprint D).
 *
 * AUDIT §3.2 + §10.3 — the marketing chrome ships in the initial HTML
 * with the plans already rendered. SEO crawlers see the prices, the
 * unauthenticated visitor sees the cards instantly, and we avoid the
 * "flash of empty grid" the previous client-side fetch produced.
 *
 * The interactive parts (plan selection + Culqi checkout dialog) live
 * in the `<PricingPlansGrid>` client island. The two fetches run in
 * parallel through `Promise.all` for a single round-trip latency.
 */

import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { PricingPlansGrid } from "@/components/billing/pricing-plans-grid";
import { getOptionalUser } from "@/lib/server/current-user";
import { getPlansServer } from "@/lib/server/plans";

export const metadata: Metadata = {
  title: "Planes y precios",
  description:
    "Plan Gratuito para siempre. Plan Profesional desde S/19.90 al mes. Plan Institucional para entidades del sector público peruano.",
};

export default async function PricingPage() {
  // Two independent reads — fire them in parallel.
  const [user, plansResponse] = await Promise.all([
    getOptionalUser("/pricing"),
    getPlansServer(),
  ]);

  const isAuthed = user !== null;
  const currentPlanCode = (user?.current_tenant?.plan ?? "free").toLowerCase();
  const provider = plansResponse?.provider ?? "Culqi";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            DocuGob
          </Link>
          <nav className="flex items-center gap-2">
            {isAuthed ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Ir al panel</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Crear cuenta</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Un plan para cada entidad pública del Perú
          </h1>
          <p className="mt-4 text-muted-foreground">
            Empieza gratis. Súbete al plan Profesional cuando necesites más
            documentos o branding propio. Cancelas cuando quieras.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          {plansResponse ? (
            <PricingPlansGrid
              plansResponse={plansResponse}
              isAuthed={isAuthed}
              currentPlanCode={currentPlanCode}
            />
          ) : (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
              No se pudieron cargar los planes. Asegúrate de que la API esté
              corriendo y refresca la página.
            </div>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Precios en soles peruanos (S/) sin IGV. Procesado por{" "}
            {provider === "mock" ? "Mock (dev)" : provider} · Métodos: tarjetas
            Visa/Mastercard.
          </p>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} DocuGob</p>
          <Link href="/" className="hover:text-foreground">
            ← Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}
