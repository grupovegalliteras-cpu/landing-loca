"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, MessageCircle, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LIVE_SPEED, useDemo } from "@/store/demo";
import { useUi, type AppRoute } from "@/store/ui";
import { SECTOR_POR_ID } from "@/data/sectors";
import { whatsappLink } from "@/data/site";
import { addDays, cn, isoDay } from "@/lib/utils";

type Ctx = { avisoId?: string; jobId?: string; invoiceId?: string; absenceId?: string };
export type TourStep = {
  title: string;
  text: string;
  side: "panel" | "app" | "both";
  /** En móvil solo cabe una pantalla: cuál enseñar en los pasos «both» */
  mobile?: "panel" | "app";
  panel?: string;
  app?: (c: Ctx) => AppRoute;
  spotlight?: string;
  duration: (c: Ctx) => number;
  run?: (c: Ctx) => void;
};

const demo = () => useDemo.getState();
const ui = () => useUi.getState();

function callDuration() {
  const s = demo();
  const tpl = SECTOR_POR_ID[s.sector].llamada;
  let t = 0;
  tpl.lineas.forEach(([, texto], i) => {
    if (i < tpl.lineas.length - 1) t += Math.max(2.2, texto.length / 16);
  });
  return (t * LIVE_SPEED + 2.4) * 1000;
}

export const STEPS: TourStep[] = [
  {
    title: "Entra una llamada",
    text: "Un cliente llama al número de siempre. Central Avisos la graba y la transcribe mientras habla. Nadie tiene que apuntar nada.",
    side: "panel",
    panel: "central-avisos",
    app: () => ({ screen: "hoy" }),
    spotlight: "aviso-list",
    duration: () => callDuration(),
    run: (c) => {
      c.avisoId = demo().simulateCall();
    },
  },
  {
    title: "La IA ya lo ha entendido",
    text: "Sabe qué cliente es, qué le pasa, si es urgente y qué servicio necesita. Y deja un resumen de una línea para la oficina.",
    side: "panel",
    panel: "central-avisos",
    spotlight: "aviso-ia",
    duration: () => 6500,
  },
  {
    title: "Un clic y el técnico lo tiene en el móvil",
    text: "La oficina crea la orden de trabajo con el técnico recomendado. Al instante le llega la notificación con todos los datos.",
    side: "both",
    mobile: "app",
    panel: "central-avisos",
    app: () => ({ screen: "hoy" }),
    spotlight: "app-banner",
    duration: () => 6500,
    run: (c) => {
      const s = demo();
      const a = s.avisos.find((x) => x.id === c.avisoId) ?? s.avisos.find((x) => x.estado === "nuevo");
      if (!a) return;
      c.avisoId = a.id;
      c.jobId = s.convertAviso(a.id, s.meId);
    },
  },
  {
    title: "Ficha desde el móvil",
    text: "El técnico ficha la entrada con su ubicación. En la oficina el panel del equipo se actualiza solo, y queda el registro de jornada.",
    side: "both",
    mobile: "panel",
    panel: "fichaje",
    app: () => ({ screen: "hoy" }),
    spotlight: "fichaje-board",
    duration: () => 5500,
    run: () => {
      const s = demo();
      s.clockIn(s.meId);
    },
  },
  {
    title: "Sale hacia el cliente",
    text: "Pulsa «Salgo hacia allí» y el cliente recibe un aviso. En la oficina, el mapa y la planificación cambian de estado en directo.",
    side: "both",
    mobile: "app",
    panel: "rutas",
    app: (c) => ({ screen: "trabajo", params: { id: c.jobId ?? "" } }),
    duration: () => 6000,
    run: (c) => {
      if (!c.jobId) c.jobId = demo().jobs.find((j) => j.techId === demo().meId && j.estado === "asignado")?.id;
      if (!c.jobId) return;
      demo().setJobStatus(c.jobId, "en-camino");
      setTimeout(() => c.jobId && demo().setJobStatus(c.jobId, "en-curso"), 3200);
    },
  },
  {
    title: "El parte, en el móvil",
    text: "Checklist del servicio, mediciones propias del sector, material de la furgoneta, fotos antes y después, y la firma del cliente con el dedo.",
    side: "app",
    panel: "trabajos",
    app: (c) => ({ screen: "parte", params: { id: c.jobId ?? "" } }),
    duration: () => 8500,
    run: () => {
      setTimeout(() => ui().emit("parte:autofill"), 700);
    },
  },
  {
    title: "Cierra el parte y la oficina lo tiene todo",
    text: "Informe en PDF enviado al cliente, material descontado del stock y la factura preparada en borrador. Sin pasar nada a mano.",
    side: "both",
    mobile: "panel",
    panel: "facturacion",
    app: (c) => ({ screen: "parte", params: { id: c.jobId ?? "" } }),
    duration: () => 6500,
    run: (c) => {
      ui().emit("parte:submit");
      setTimeout(() => {
        const j = demo().jobs.find((x) => x.id === c.jobId);
        c.invoiceId = j?.facturaId;
        if (c.invoiceId) ui().setPanelFocus(c.invoiceId);
      }, 500);
    },
  },
  {
    title: "Factura con VeriFactu en un clic",
    text: "Se numera, se registra con VeriFactu con su QR y sale con un enlace de pago por tarjeta o Bizum.",
    side: "panel",
    panel: "facturacion",
    spotlight: "emitir-factura",
    duration: () => 6000,
    run: (c) => {
      if (!c.invoiceId) c.invoiceId = demo().invoices.filter((i) => i.estado === "borrador").pop()?.id;
      if (!c.invoiceId) return;
      ui().setPanelFocus(c.invoiceId);
      setTimeout(() => c.invoiceId && demo().issueInvoice(c.invoiceId), 1800);
    },
  },
  {
    title: "El cliente paga desde el móvil",
    text: "Paga con Bizum desde el enlace. La factura pasa a cobrada y el panel de dirección lo refleja al momento.",
    side: "panel",
    panel: "direccion",
    duration: () => 6000,
    run: (c) => {
      if (c.invoiceId) demo().payInvoice(c.invoiceId, "bizum");
    },
  },
  {
    title: "Y el equipo, sin papeles",
    text: "El técnico pide vacaciones desde la app. La oficina las ve al momento en el calendario del equipo.",
    side: "both",
    mobile: "panel",
    panel: "vacaciones",
    app: () => ({ screen: "vacaciones" }),
    spotlight: "vacaciones-pendientes",
    duration: () => 5500,
    run: (c) => {
      const d = addDays(new Date(), 30);
      c.absenceId = demo().requestAbsence(demo().meId, isoDay(d), isoDay(addDays(d, 4)));
    },
  },
  {
    title: "Aprobadas, y le llega el aviso",
    text: "Un clic en la oficina y el técnico recibe la respuesta en el móvil. Lo mismo con nóminas, comunicados y documentos.",
    side: "both",
    mobile: "app",
    panel: "vacaciones",
    app: () => ({ screen: "vacaciones" }),
    spotlight: "app-banner",
    duration: () => 6000,
    run: (c) => {
      if (c.absenceId) demo().resolveAbsence(c.absenceId, true);
    },
  },
];

export function useTour(onView?: (side: "panel" | "app") => void) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const ctx = useRef<Ctx>({});
  const ran = useRef<Set<number>>(new Set());
  // tiempo acumulado del paso actual, sin provocar renders
  const clock = useRef({ acc: 0, since: 0 });
  const setElapsed = (v: number) => {
    clock.current = { acc: v, since: performance.now() };
  };

  const enter = useCallback(
    (i: number) => {
      const s = STEPS[i];
      if (!s) return;
      if (s.panel) ui().setPanelSection(s.panel);
      if (s.app) ui().appReset(s.app(ctx.current));
      onView?.(s.mobile ?? (s.side === "both" ? "panel" : s.side));
      if (!ran.current.has(i)) {
        ran.current.add(i);
        s.run?.(ctx.current);
      }
      ui().setSpotlight(s.spotlight ?? null);
      setElapsed(0);
    },
    [onView],
  );

  const start = useCallback(() => {
    demo().reset();
    ui().setOffline(false);
    ctx.current = {};
    ran.current = new Set();
    setActive(true);
    setPlaying(true);
    setStep(0);
    setTimeout(() => enter(0), 350);
  }, [enter]);

  const stop = useCallback(() => {
    setActive(false);
    ui().setSpotlight(null);
  }, []);

  const go = useCallback(
    (i: number) => {
      if (i < 0) return;
      if (i >= STEPS.length) {
        setStep(STEPS.length);
        ui().setSpotlight(null);
        return;
      }
      // al saltar hacia delante, ejecuta los pasos intermedios pendientes
      for (let k = 0; k < i; k++) {
        if (!ran.current.has(k)) {
          ran.current.add(k);
          STEPS[k].run?.(ctx.current);
        }
      }
      setStep(i);
      enter(i);
    },
    [enter],
  );

  useEffect(() => {
    if (!active || step >= STEPS.length) return;
    if (!playing) {
      // al pausar, guarda lo transcurrido
      clock.current = { acc: clock.current.acc + (clock.current.since ? performance.now() - clock.current.since : 0), since: 0 };
      return;
    }
    const dur = STEPS[step].duration(ctx.current);
    clock.current.since = performance.now();
    const t = setTimeout(() => go(step + 1), Math.max(0, dur - clock.current.acc));
    return () => clearTimeout(t);
  }, [active, playing, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // si alguien cambia de sector (aquí o en otra pestaña) el recorrido deja de tener sentido
  useEffect(() => {
    if (!active) return;
    const sector = demo().sector;
    return useDemo.subscribe((s) => {
      if (s.sector !== sector) stop();
    });
  }, [active, stop]);

  const getProgress = useCallback(() => {
    if (step >= STEPS.length) return 1;
    const dur = STEPS[step].duration(ctx.current);
    const e = clock.current.acc + (clock.current.since ? performance.now() - clock.current.since : 0);
    return Math.min(1, e / dur);
  }, [step]);

  useEffect(() => {
    if (!active) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") go(step + 1);
      else if (e.key === "ArrowLeft") go(step - 1);
      else if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [active, step, go, stop]);

  return { active, step, playing, setPlaying, start, stop, go, getProgress };
}

function TourProgress({ t }: { t: ReturnType<typeof useTour> }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (bar.current) bar.current.style.width = `${((t.step + t.getProgress()) / STEPS.length) * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [t]);
  return (
    <div className="h-1 bg-white/10">
      <div ref={bar} className="h-full bg-sun" />
    </div>
  );
}

export function TourCard({ t }: { t: ReturnType<typeof useTour> }) {
  if (!t.active) return null;
  const s = STEPS[t.step];
  const end = t.step >= STEPS.length;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-auto w-full overflow-hidden rounded-2xl lg:w-[440px] border border-white/10 bg-[#0c1a22]/95 text-white shadow-e3 backdrop-blur-xl" role="region" aria-label="Recorrido guiado">
      {!end && <TourProgress t={t} />}
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="tabular">{end ? "Fin del recorrido" : `Paso ${t.step + 1} de ${STEPS.length}`}</span>
          <button onClick={t.stop} className="grid size-6 place-items-center rounded-md hover:bg-white/10" aria-label="Cerrar recorrido">
            <X className="size-3.5" />
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={t.step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {end ? (
              <>
                <div className="mt-0.5 font-display text-lg font-semibold sm:mt-1 sm:text-xl">De la llamada a la factura cobrada, sin papeles</div>
                <p className="mt-1 text-[13px] leading-snug text-white/75 sm:mt-1.5 sm:text-[14px] sm:leading-relaxed">Esto es lo que hace tu equipo cada día, pero sin apuntar, sin llamar para preguntar y sin pasar nada a mano. Lo montamos con los datos de tu empresa.</p>
              </>
            ) : (
              <>
                <div className="mt-0.5 font-display text-lg leading-tight font-semibold sm:mt-1 sm:text-xl">{s.title}</div>
                <p className="mt-1 text-[13px] leading-snug text-white/75 sm:mt-1.5 sm:text-[14px] sm:leading-relaxed">{s.text}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 flex items-center gap-2 sm:mt-4">
          {end ? (
            <>
              <button onClick={t.start} className="h-10 rounded-lg px-3 text-[13px] text-white/80 hover:bg-white/10">
                Ver otra vez
              </button>
              <a href={whatsappLink("Hola, he visto el recorrido de la demo de Nexo4Pymes y me gustaría verla con los datos de mi empresa.")} target="_blank" rel="noreferrer" className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-sun px-4 text-[14px] font-semibold text-[#1d1300]">
                <MessageCircle className="size-4" /> La quiero con mis datos
              </a>
            </>
          ) : (
            <>
              <button onClick={() => t.go(t.step - 1)} disabled={t.step === 0} className="grid size-10 place-items-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30" aria-label="Paso anterior">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={() => t.setPlaying(!t.playing)} className="flex h-10 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[13px] font-medium hover:bg-white/15" aria-label={t.playing ? "Pausar" : "Reanudar"}>
                {t.playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {t.playing ? "Pausar" : "Seguir"}
              </button>
              <button onClick={() => t.go(t.step + 1)} className="flex h-10 items-center gap-1 rounded-lg bg-white text-[#0c1a22] px-3 text-[13px] font-semibold hover:bg-white/90 max-lg:ml-auto" aria-label="Paso siguiente">
                Siguiente <ChevronRight className="size-4" />
              </button>
              <span className="ml-auto hidden text-[11px] text-white/40 lg:inline">Espacio para pausar</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Anillo que señala un elemento con data-tour */
export function Spotlight() {
  const target = useUi((s) => s.spotlight);
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    let raf = 0;
    let last = "";
    const tick = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      const r = el?.getBoundingClientRect() ?? null;
      const key = r ? `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)}` : "";
      if (key !== last) {
        last = key;
        setRect(r && r.width > 0 ? r : null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <AnimatePresence>
      {rect && (
        <motion.div
          key={target}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1, left: rect.x - 6, top: rect.y - 6, width: rect.width + 12, height: rect.height + 12 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          className={cn("pointer-events-none fixed z-[95] rounded-2xl border-2 border-sun shadow-[0_0_0_4px_rgb(245_171_46/0.25),0_0_40px_rgb(245_171_46/0.35)]")}
          style={{ left: rect.x - 6, top: rect.y - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
    </AnimatePresence>
  );
}
