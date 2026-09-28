import { ogImage, OG_SIZE } from "@/lib/og";
import { SECTORES, SECTOR_POR_ID, isSectorId } from "@/data/sectors";

export const alt = "Nexo4Pymes para tu sector";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return SECTORES.map((s) => ({ sector: s.id }));
}

export default async function Image({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const s = isSectorId(sector) ? SECTOR_POR_ID[sector] : SECTORES[0];
  return await ogImage({
    kicker: s.nombre,
    title: `Tu empresa de ${s.nombre.toLowerCase()}, sin papeles`,
    sub: s.dolor,
    chips: ["Mira la demo de tu sector", "Hecho en Mallorca"],
  });
}
