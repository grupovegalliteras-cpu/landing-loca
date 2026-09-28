/** Datos de contacto que usa la llamada a la acción. Cámbialos aquí. */
export const CONTACTO = {
  whatsapp: "34661922690",
  whatsappVisible: "661 92 26 90",
  email: "grupovegalliteras@gmail.com",
  ciudad: "Palma de Mallorca",
  web: "https://nexo4pymes.com/",
};

export function whatsappLink(texto: string) {
  return `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/** Dirección pública de la web, para las vistas previas de WhatsApp y el sitemap. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
