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
