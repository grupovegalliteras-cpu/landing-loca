import type { Metadata, Viewport } from "next";
import { Geist, Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/data/site";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nexo4Pymes: panel de gestión y app para empresas de servicios",
    template: "%s | Nexo4Pymes",
  },
  description:
    "Panel de oficina y app de operarios conectados en tiempo real. Avisos, trabajos, rutas, facturación con VeriFactu, equipo y nóminas. Hecho en Mallorca.",
  applicationName: "Nexo4Pymes",
  // lo que se ve al pegar el enlace en WhatsApp
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Nexo4Pymes",
    title: "Nexo4Pymes: la llamada entra, el trabajo sale solo",
    description: "Mira en vivo cómo un aviso se convierte en orden, parte firmado y factura con VeriFactu. Panel de oficina y app de técnicos.",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "Nexo Campo", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f7" },
    { media: "(prefers-color-scheme: dark)", color: "#081116" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('nexo-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geist.variable} ${bricolage.variable} antialiased`}>
      <body className="min-h-dvh">
        <Script id="nexo-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
