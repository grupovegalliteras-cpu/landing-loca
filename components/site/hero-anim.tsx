"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BadgeCheck, Bell, Check, MapPin, Navigation, PhoneIncoming, Sparkles, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useSector } from "@/store/demo";
import { cn } from "@/lib/utils";

const T = [0, 1300, 5600, 7000, 8600, 10900, 13000, 16500];

export function HeroAnim() {
  const sector = useSector();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) {
      setPhase(6);
      return;
    }
    setPhase(0);
    const timers = T.slice(1).map((ms, i) =>
      setTimeout(() => {
        if (i + 1 === T.length - 1) setCycle((c) => c + 1);
        else setPhase(i + 1);
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [cycle, reduce, sector.id]);

  const L = sector.llamada;
  const lines = L.lineas.filter(([s]) => s === "cliente").slice(0, 2).map(([, t]) => t);
  const serv = sector.servicios[L.servicio];
  const clienteCorto = L.cliente;

  return (
    <div className="relative mx-auto h-[540px] w-full max-w-[600px] select-none sm:h-[560px]" aria-label="Animación: una llamada se convierte en un trabajo en el móvil del técnico" role="img">
      {/* tarjeta de llamada */}
      <motion.div
        key={`call-${cycle}`}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute top-2 left-0 w-[88%] rounded-[22px] border border-white/12 bg-[#06222c]/75 p-4 text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl sm:w-[76%]"
      >
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-full bg-sun text-[#1d1300]">
            {phase === 0 && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-sun" />}
            <PhoneIncoming className="relative size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-white/55">{phase === 0 ? "Llamada entrante" : "Central Avisos, grabando"}</div>
            <div className="truncate text-[15px] font-semibold">{clienteCorto}</div>
          </div>
          {phase >= 1 && (
            <span className="flex h-4 items-center gap-[2px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.span key={i} className="w-[3px] rounded-full bg-sun" animate={phase < 2 ? { height: ["20%", "100%", "35%", "80%", "20%"] } : { height: "25%" }} transition={{ duration: 0.8 + (i % 3) * 0.15, repeat: phase < 2 ? Infinity : 0, delay: i * 0.05 }} />
              ))}
            </span>
          )}
        </div>
        <div className="mt-3 grid min-h-[92px] gap-1.5">
          {lines.map((l, i) => (
            <Typed key={`${cycle}-${i}`} text={l} start={phase >= 1} delay={i * 1900} />
          ))}
        </div>
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#b9b0ff]">
                <Sparkles className="size-3.5" /> Clasificado por IA
              </div>
              <motion.div className="mt-1.5 flex flex-wrap gap-1.5" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.12 } } }}>
                {[
                  [L.tipo[0].toUpperCase() + L.tipo.slice(1), "bg-white/10"],
                  [L.urgencia === "alta" ? "Urgente" : "Prioridad media", L.urgencia === "alta" ? "bg-[#ff6b61]/25 text-[#ffb3ad]" : "bg-sun/20 text-sun"],
                  ["Cliente reconocido", "bg-[#37c28a]/20 text-[#7fe3b8]"],
                  [serv.nombre, "bg-white/10"],
                ].map(([t, cls]) => (
                  <motion.span key={t} variants={{ h: { opacity: 0, y: 6, filter: "blur(4px)" }, s: { opacity: 1, y: 0, filter: "blur(0px)" } }} className={cn("rounded-md px-2 py-1 text-[12px] font-medium", cls)}>
                    {t}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/[0.07] p-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-[#3db1d3] text-[#041319]">
                <Wrench className="size-4" />
              </span>
              <div className="min-w-0 text-[12.5px] leading-tight">
                <div className="font-semibold">OT-2431 creada y asignada</div>
                <div className="text-white/60">A Toni Ferrer, el técnico más cercano</div>
              </div>
              <Check className="ml-auto size-4 text-[#7fe3b8]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* línea de conexión */}
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 600 560" preserveAspectRatio="none" aria-hidden>
        <motion.path
          d="M 300 300 C 380 320, 360 380, 430 390"
          fill="none"
          stroke="#f5ab2e"
          strokeWidth="2"
          strokeDasharray="5 7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={phase >= 3 ? { pathLength: 1, opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.9 }}
        />
      </svg>

      {/* móvil del técnico */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 4 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
        className="absolute right-0 bottom-0 h-[380px] w-[200px] rounded-[34px] bg-[#0b1115] p-[7px] shadow-[0_40px_80px_-20px_rgb(0_0_0/0.7),inset_0_0_0_1px_rgb(255_255_255/0.08)] sm:h-[420px] sm:w-[218px]"
      >
        <div className="relative h-full overflow-hidden rounded-[28px] bg-[#f4f6f7] text-[#0c1a22]">
          <span className="absolute top-2 left-1/2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />
          <div className="px-3.5 pt-9">
            <div className="text-[9px] font-medium text-[#7a8893]">Hoy</div>
            <div className="font-display text-[17px] leading-tight font-semibold">Buenos días, Toni</div>
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
              <span className="size-1.5 rounded-full bg-[#13845a]" />
              <span className="text-[10px] text-[#465661]">Trabajando</span>
              <span className="ml-auto font-display text-[12px] font-semibold tabular-nums">02:14:08</span>
            </div>
            <div className="mt-2.5 text-[9px] font-medium text-[#7a8893]">Siguiente parada</div>
            <AnimatePresence mode="wait">
              {phase >= 4 ? (
                <motion.div key="new" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="mt-1 rounded-xl bg-white p-2.5 shadow-md ring-2 ring-[#f5ab2e]">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#fbe6e4] px-1 py-0.5 text-[8px] font-semibold text-[#cf3f37]">Urgente</span>
                    <span className={cn("ml-auto rounded px-1 py-0.5 text-[8px] font-semibold", phase >= 5 ? "bg-[#fdf1dc] text-[#b7740a]" : "bg-[#e5edfb] text-[#2f6ad0]")}>{phase >= 5 ? "En camino" : "Asignado"}</span>
                  </div>
                  <div className="mt-1 text-[13px] leading-tight font-semibold">{clienteCorto}</div>
                  <div className="text-[10px] text-[#465661]">{serv.nombre}</div>
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-[#7a8893]">
                    <MapPin className="size-2.5" /> {L.instalacionNombre}
                  </div>
                  <div className={cn("mt-2 flex h-7 items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition-colors", phase >= 5 ? "bg-[#13845a] text-white" : "bg-[#0a5d78] text-white")}>
                    {phase >= 5 ? <Check className="size-3" /> : <Navigation className="size-3" />}
                    {phase >= 5 ? "El cliente ya está avisado" : "Salgo hacia allí"}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="old" exit={{ opacity: 0 }} className="mt-1 rounded-xl bg-white p-2.5 shadow-sm">
                  <div className="text-[13px] font-semibold">Comunidad Es Born 12</div>
                  <div className="text-[10px] text-[#465661]">{sector.servicios[3]?.nombre ?? serv.nombre}, 12:00</div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-2.5 grid gap-1.5">
              {["09:30 Villa Els Tarongers", "16:30 Forn Nou Inca"].map((x, i) => (
                <div key={x} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-[10px] shadow-sm">
                  <span className={cn("grid size-3.5 place-items-center rounded-full border", i === 0 ? "border-[#13845a] bg-[#13845a] text-white" : "border-[#c6cfd5]")}>{i === 0 && <Check className="size-2" />}</span>
                  <span className={cn(i === 0 && "text-[#7a8893] line-through")}>{x}</span>
                </div>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {phase === 4 && (
              <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} transition={{ type: "spring", bounce: 0.35, duration: 0.6 }} className="absolute top-2 right-2 left-2 z-30 flex gap-2 rounded-2xl bg-[#1b2a33]/95 p-2 text-white shadow-xl backdrop-blur">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#0a5d78]">
                  <Bell className="size-3.5" />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-[10px] font-semibold">Trabajo urgente asignado</span>
                  <span className="block truncate text-[9.5px] text-white/75">{clienteCorto}: {serv.nombre}</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* factura cobrada */}
      <AnimatePresence>
        {phase >= 6 && (
          <motion.div initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", bounce: 0.3 }} className="absolute bottom-6 left-0 flex items-center gap-3 rounded-2xl border border-white/12 bg-[#06222c]/80 p-3 pr-4 text-white shadow-[0_20px_50px_-15px_rgb(0_0_0/0.6)] backdrop-blur-xl sm:left-4">
            <span className="grid size-9 place-items-center rounded-full bg-[#37c28a] text-[#04150e]">
              <BadgeCheck className="size-5" />
            </span>
            <div className="text-[12.5px] leading-tight">
              <div className="font-semibold">Factura registrada con VeriFactu</div>
              <div className="text-white/65">Cobrada por Bizum, parte e informe enviados</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Typed({ text, start, delay }: { text: string; start: boolean; delay: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    let iv: ReturnType<typeof setInterval>;
    const t = setTimeout(() => {
      iv = setInterval(() => setN((x) => (x >= text.length ? x : x + 2)), 28);
    }, delay);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [start, text, delay]);
  if (!n) return null;
  return (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13.5px] leading-snug text-white/85">
      <span className="mr-1.5 text-[11px] text-white/40">Cliente</span>
      {text.slice(0, n)}
      {n < text.length && <span className="ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 animate-pulse bg-white" />}
    </motion.p>
  );
}
