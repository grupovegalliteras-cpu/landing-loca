"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useUi, type AppScreen } from "@/store/ui";
import { AppShell, PhoneFrame } from "./shell";
import { QrSvg } from "@/components/panel/screens/finanzas";
import { useSector } from "@/store/demo";

export function AppRoutePage({ initial }: { initial: string }) {
  const [mobile, setMobile] = useState<boolean | null>(null);
  const [url, setUrl] = useState("");
  const [scale, setScale] = useState(1);
  const sector = useSector();
  useEffect(() => {
    useUi.getState().appReset({ screen: initial as AppScreen });
    const upd = () => {
      setMobile(window.innerWidth < 640);
      setScale(Math.min(1, (window.innerHeight - 48) / 820));
    };
    upd();
    setUrl(window.location.origin + "/app");
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, [initial]);

  if (mobile === null) return <div className="h-dvh bg-bg" />;
  if (mobile) return <AppShell framed={false} />;
  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,var(--brand-soft),var(--bg)_60%)] p-6">
      <div className="flex items-center gap-14">
        <PhoneFrame scale={scale}>
          <AppShell />
        </PhoneFrame>
        <div className="hidden max-w-xs lg:block">
          <div className="flex items-center gap-2 text-sm font-medium text-brand">
            <Smartphone className="size-4" /> App de operarios de {sector.empresa}
          </div>
          <h1 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight">Pruébala en tu móvil</h1>
          <p className="mt-2 text-sm text-fg-2">Escanea el código con la cámara. Se instala desde el navegador, sin tienda de aplicaciones, y funciona aunque no haya cobertura.</p>
          {url && <QrSvg text={url} className="mt-5 size-40 rounded-xl border border-line" />}
          <Link href="/demo" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium shadow-e1 hover:bg-surface-2">
            <Monitor className="size-4" /> Verla junto al panel de oficina
          </Link>
        </div>
      </div>
    </div>
  );
}
