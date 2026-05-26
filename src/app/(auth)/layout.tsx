import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand panel — institutional blue band */}
      <aside className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <Link href="/" className="text-2xl font-semibold tracking-tight">
          DocuGob
        </Link>
        <div className="space-y-3 max-w-md">
          <p className="text-lg leading-relaxed">
            Genera oficios, memorandos e informes administrativos en minutos,
            conforme a la Ley N° 27444.
          </p>
          <p className="text-sm opacity-80">
            Diseñado para secretarias, asistentes administrativos y jefaturas
            del sector público peruano.
          </p>
        </div>
        <div className="space-y-2 text-xs opacity-70">
          <p>
            © {new Date().getFullYear()} DocuGob · Plataforma SaaS para el
            sector público peruano
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <Link
              href="/terminos"
              className="underline-offset-4 hover:underline hover:opacity-100"
            >
              Términos
            </Link>
            <Link
              href="/privacidad"
              className="underline-offset-4 hover:underline hover:opacity-100"
            >
              Privacidad
            </Link>
          </p>
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
