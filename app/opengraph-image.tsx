import { ogImage, OG_SIZE } from "@/lib/og";

export const alt = "Nexo4Pymes: la llamada entra, el trabajo sale solo";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return await ogImage({
    kicker: "Demo en vivo",
    title: "La llamada entra. El trabajo sale solo.",
    sub: "Avisos, órdenes de trabajo, parte con fotos y firma, y factura con VeriFactu. Panel de oficina y app de técnicos, conectados.",
    chips: ["Pruébala desde el móvil", "Hecho en Mallorca"],
  });
}
