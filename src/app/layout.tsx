import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

// TDR §7.2 — Inter UI is the chosen sans-serif for the application chrome.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DocuGob — Automatización de documentos administrativos",
    template: "%s · DocuGob",
  },
  description:
    "Plataforma para la generación automática de oficios, memorandos, informes y otros documentos administrativos del sector público peruano, conforme a la Ley N° 27444.",
  authors: [{ name: "DocuGob" }],
};

// Next.js 16 — themeColor must live under `viewport`, not `metadata`.
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-PE"
      className={cn("h-full antialiased", inter.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <QueryProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
