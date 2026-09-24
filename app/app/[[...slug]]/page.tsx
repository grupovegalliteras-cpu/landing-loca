import type { Metadata } from "next";
import { AppRoutePage } from "@/components/app/app-route";

export const metadata: Metadata = { title: "App de operarios", description: "La app que usa el técnico en campo: ruta, partes, fotos, firma y fichaje." };

const SCREENS = ["hoy", "ruta", "fichar", "chat", "mas", "vacaciones", "docs", "qr", "gasto", "turnos", "comunicados", "notificaciones", "incidencia"];

export function generateStaticParams() {
  return [{ slug: [] }, ...SCREENS.map((s) => ({ slug: [s] }))];
}

export default async function Page({ params }: PageProps<"/app/[[...slug]]">) {
  const { slug } = await params;
  const s = slug?.[0];
  return <AppRoutePage initial={s && SCREENS.includes(s) ? s : "hoy"} />;
}
