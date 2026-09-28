import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTORES, SECTOR_POR_ID, isSectorId } from "@/data/sectors";
import { SectorPage } from "@/components/site/sector-page";

export function generateStaticParams() {
  return SECTORES.map((s) => ({ sector: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/sectores/[sector]">): Promise<Metadata> {
  const { sector } = await params;
  if (!isSectorId(sector)) return {};
  const s = SECTOR_POR_ID[sector];
  const title = `${s.nombre}: panel y app para tu empresa`;
  const description = `${s.lema}. ${s.dolor}`;
  return { title, description, openGraph: { type: "website", locale: "es_ES", siteName: "Nexo4Pymes", title: `Nexo4Pymes para ${s.nombre.toLowerCase()}`, description } };
}

export default async function Page({ params }: PageProps<"/sectores/[sector]">) {
  const { sector } = await params;
  if (!isSectorId(sector)) notFound();
  return <SectorPage id={sector} />;
}
