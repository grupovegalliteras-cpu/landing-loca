import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MODULOS, MODULO_POR_ID } from "@/data/modules";
import { PanelShell } from "@/components/panel/shell";

export function generateStaticParams() {
  return [{ slug: [] }, ...MODULOS.map((m) => ({ slug: [m.id] }))];
}

export async function generateMetadata({ params }: PageProps<"/panel/[[...slug]]">): Promise<Metadata> {
  const { slug } = await params;
  const m = MODULO_POR_ID[slug?.[0] ?? "direccion"];
  return { title: m ? `${m.nombre}, panel de oficina` : "Panel de oficina" };
}

export default async function PanelPage({ params }: PageProps<"/panel/[[...slug]]">) {
  const { slug } = await params;
  const section = slug?.[0] ?? "direccion";
  if (!MODULO_POR_ID[section] || (slug && slug.length > 1)) notFound();
  return <PanelShell mode="route" initialSection={section} />;
}
