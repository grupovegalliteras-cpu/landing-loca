import type { Metadata } from "next";
import { DemoPage } from "@/components/demo/demo-page";

export const metadata: Metadata = {
  title: "Demo en vivo",
  description: "Panel de oficina y app del técnico, lado a lado y sincronizados. Con recorrido guiado.",
};

export default function Page() {
  return <DemoPage />;
}
