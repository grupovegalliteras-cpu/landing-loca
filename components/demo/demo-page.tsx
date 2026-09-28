"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ExternalLink, Monitor, PlayCircle, RotateCcw, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PanelShell } from "@/components/panel/shell";
import { AppShell, PhoneFrame } from "@/components/app/shell";
import { SECTORES, type SectorId } from "@/data/sectors";
import { useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/logo";
import { Spotlight, TourCard, useTour } from "./tour";

/**
 * Pinta el panel al ancho del breakpoint activo y lo escala al hueco disponible,
 * para que su maquetación sea la misma que a pantalla completa.
 */
function ScaledBox({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0, s: 1 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const upd = () => {
      const aw = el.clientWidth;
      const ah = el.clientHeight;
      const vw = window.innerWidth;
      const w = vw >= 1280 ? Math.max(1280, aw) : vw >= 1024 ? Math.max(1024, aw) : aw;
      const s = aw / w;
      setDim({ w, h: ah / s, s });
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="relative size-full overflow-hidden">
      {dim.w > 0 && (
        <div className="absolute top-0 left-0 origin-top-left" style={{ width: dim.w, height: dim.h, transform: `scale(${dim.s})` }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DemoPage() {
  const sector = useSector();
  const setSector = useDemo((s) => s.setSector);
  const reset = useDemo((s) => s.reset);
  const [view, setView] = useState<"panel" | "app">("panel");
  const [scale, setScale] = useState(0.8);
  const [wide, setWide] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const onView = useCallback((side: "panel" | "app") => setView(side), []);
  const tour = useTour(onView);
  const guiado = tour.active && !wide;

  useEffect(() => {
    const upd = () => {
      const h = stage.current?.clientHeight ?? window.innerHeight - 64;
      setScale(Math.max(0.55, Math.min(0.95, (h - 24) / 820)));
      setWide(window.innerWidth >= 1024);
    };
    upd();
    // el hueco cambia cuando aparece el recorrido: se mide el escenario, no la ventana
    const ro = new ResizeObserver(upd);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("tour") === "1") {
      const t = setTimeout(() => tour.start(), 900);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    useUi.getState().setPanelSection("direccion");
    useUi.getState().appReset({ screen: "hoy" });
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-[#0a161c] text-fg">
      {/* en el móvil, durante el recorrido, fuera barras: toda la pantalla para la demo */}
      <header className={cn("flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 text-white sm:px-4", guiado && "hidden")}>
        <Link href="/" className="flex items-center gap-2" aria-label="Inicio de Nexo4Pymes">
          <Logo className="h-6 max-[400px]:[&>span]:hidden" light />
        </Link>
        <span className="hidden h-5 w-px bg-white/15 md:block" />
        <span className="hidden text-[13px] text-white/60 md:block">Modo presentación</span>
        <select
          value={sector.id}
          onChange={(e) => {
            tour.stop();
            setSector(e.target.value as SectorId);
          }}
          className="ml-auto h-8 min-w-0 max-w-[46vw] rounded-lg border border-white/15 bg-white/5 px-2 text-[13px] text-white outline-none md:ml-4"
          aria-label="Sector de la demo"
        >
          {SECTORES.map((s) => (
            <option key={s.id} value={s.id} className="text-black">
              {s.nombre}: {s.empresa}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 md:ml-auto">
          <button onClick={() => { tour.stop(); reset(); }} className="hidden h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-white/70 hover:bg-white/10 sm:flex" title="Reiniciar demo">
            <RotateCcw className="size-3.5" /> Reiniciar
          </button>
          <Link href="/app" target="_blank" className="hidden h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-white/70 hover:bg-white/10 lg:flex" title="Abrir la app en otra pestaña">
            <ExternalLink className="size-3.5" /> App en otra pestaña
          </Link>
          <motion.button whileTap={{ scale: 0.96 }} onClick={tour.start} className="flex h-8 items-center gap-1.5 rounded-lg bg-sun px-3 text-[13px] font-semibold text-[#1d1300]" data-tour="ver-recorrido">
            <PlayCircle className="size-4" /> <span className="max-[400px]:hidden">Ver recorrido</span><span className="min-[401px]:hidden">Recorrido</span>
          </motion.button>
        </div>
      </header>

      {/* selector en pantallas pequeñas */}
      <div className={cn("flex justify-center gap-1 border-b border-white/10 p-1.5 lg:hidden", guiado && "hidden")}>
        {(["panel", "app"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cn("flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium", view === v ? "bg-white text-[#0a161c]" : "text-white/70")}>
            {v === "panel" ? <Monitor className="size-4" /> : <Smartphone className="size-4" />}
            {v === "panel" ? "Oficina" : "Móvil del técnico"}
          </button>
        ))}
      </div>

      <div ref={stage} className={cn("relative flex min-h-0 flex-1 gap-4 p-2 sm:p-3 lg:gap-5", guiado && "pt-[max(0.5rem,env(safe-area-inset-top))]")}>
        <div className={cn("min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/10 shadow-e3", view !== "panel" && "max-lg:hidden")}>
          <ScaledBox>
            <PanelShell mode="embedded" compact />
          </ScaledBox>
        </div>
        <div className={cn("flex shrink-0 flex-col items-center justify-center gap-2 max-lg:flex-1", view !== "app" && "max-lg:hidden")}>
          {wide ? (
            <PhoneFrame scale={scale}>
              <AppShell />
            </PhoneFrame>
          ) : (
            // en un móvil de verdad sobra el marco: la app ocupa el hueco
            <div className="relative w-full max-w-[430px] flex-1 overflow-hidden rounded-2xl border border-white/10">
              <AppShell />
            </div>
          )}
          <div className="hidden items-center gap-1.5 text-[11px] text-white/40 lg:flex">
            <span className="size-1.5 rounded-full bg-ok" /> Conectados en tiempo real
          </div>
        </div>
      </div>
      {/* en móvil el recorrido va debajo, sin tapar la pantalla; en escritorio flota abajo a la izquierda */}
      <div className="z-[96] shrink-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] empty:hidden lg:pointer-events-none lg:fixed lg:bottom-6 lg:left-6 lg:p-0">
        <TourCard t={tour} compact={!wide} />
      </div>
      <Spotlight />
    </div>
  );
}
