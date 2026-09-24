import type { Metadata } from "next";
import { Servicios } from "@/components/site/servicios";

export const metadata: Metadata = {
  title: "Catálogo de servicios",
  description: "Todos los módulos de Nexo4Pymes agrupados: captación, clientes, operaciones, facturación, equipo y datos.",
};

export default function Page() {
  return <Servicios />;
}
