"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Files, Plus, Sparkles } from "lucide-react";

export default function DashboardHomePage() {
  const { data: user } = useCurrentUser();
  const firstName = user?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {firstName ? `Hola, ${firstName}` : "Bienvenido a DocuGob"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {user?.current_tenant?.name
            ? `Trabajando en ${user.current_tenant.name}`
            : "Carga inicial completa."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <CardTitle>Crear un documento</CardTitle>
            <CardDescription>
              Inicia el asistente de 4 pasos: tipo → datos → IA → vista previa.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/documents/new">Comenzar</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Files className="h-5 w-5" />
            </div>
            <CardTitle>Mis documentos</CardTitle>
            <CardDescription>
              Revisa, descarga o continúa borradores ya iniciados.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/dashboard/documents">Ver documentos</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="rounded-lg border bg-muted/30 p-6">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-medium">Atajo de teclado</h2>
            <p className="text-sm text-muted-foreground">
              Presiona{" "}
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
                <span className="text-xs">⌘</span>K
              </kbd>{" "}
              (o{" "}
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px]">
                Ctrl K
              </kbd>
              ) en cualquier pantalla para abrir el buscador de comandos y crear
              un nuevo oficio, memorando o informe sin moverte del teclado.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
