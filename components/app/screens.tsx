"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle, Bell, Camera, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight, Clock, Coffee, FileText, History, LogIn, LogOut,
  MapPin, Megaphone, MessageCircle, Navigation, Palmtree, Phone, Play, QrCode, Receipt, ScanLine, Send, Sparkles, Wifi, WifiOff, Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { useDemo, useSector } from "@/store/demo";
import { useUi, type AppScreen } from "@/store/ui";
import { optimizeOrder, useMaps, useNow } from "@/lib/hooks";
import { addDays, cn, fmt, hashString, isoDay, startOfDay } from "@/lib/utils";
import { Avatar, Badge, JobStatusBadge, UrgencyBadge } from "@/components/ui";
import { MallorcaMap } from "@/components/mallorca-map";
import { FakePhoto } from "@/components/photo";
import { BASE } from "@/data/seed";
import { Parte } from "./parte";

type P = { params: Record<string, string> };

/* ---------- piezas comunes ---------- */
export function AppHeader({ title, sub, back = true, right }: { title: ReactNode; sub?: ReactNode; back?: boolean; right?: ReactNode }) {
  const pop = useUi((s) => s.appBack);
  return (
    <div className="sticky top-0 z-20 bg-bg/90 px-4 pt-1 pb-2 backdrop-blur">
      <div className="flex h-9 items-center justify-between">
        {back ? (
          <button onClick={pop} className="-ml-1.5 flex items-center text-[15px] text-brand" aria-label="Volver">
            <ChevronLeft className="size-6" /> Atrás
          </button>
        ) : (
          <span />
        )}
        {right}
      </div>
      <h1 className="font-display text-[26px] leading-tight font-semibold tracking-tight">{title}</h1>
      {sub && <div className="text-[13px] text-fg-3">{sub}</div>}
    </div>
  );
}

function Group({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <section className={cn("px-4", className)}>
      {title && <h2 className="mb-1.5 px-1 text-[13px] font-medium text-fg-3">{title}</h2>}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-e1">{children}</div>
    </section>
  );
}

function Row({ icon, title, sub, right, onClick, tone }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; tone?: string }) {
  const C = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className="flex w-full items-center gap-3 border-b border-line/70 px-3.5 py-3 text-left last:border-0 active:bg-surface-2">
      {icon && <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px]", tone ?? "bg-surface-2 text-fg-2")}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px]">{title}</span>
        {sub && <span className="block truncate text-[13px] text-fg-3">{sub}</span>}
      </span>
      {right ?? (onClick && <ChevronRight className="size-4 text-fg-3" />)}
    </C>
  );
}

function BigButton({ children, onClick, variant = "primary", className, disabled, tour }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "sun" | "secondary" | "ok" | "bad"; className?: string; disabled?: boolean; tour?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      data-tour={tour}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-semibold disabled:opacity-40",
        variant === "primary" && "bg-brand text-brand-ink",
        variant === "sun" && "bg-sun text-[#1d1300]",
        variant === "secondary" && "bg-surface text-fg shadow-e1",
        variant === "ok" && "bg-ok text-white",
        variant === "bad" && "bg-bad-soft text-bad",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

function useMe() {
  const meId = useDemo((s) => s.meId);
  return useDemo((s) => s.techs.find((t) => t.id === meId)!);
}

function useMyJobs(day = isoDay(new Date())) {
  const meId = useDemo((s) => s.meId);
  const jobs = useDemo((s) => s.jobs);
  return useMemo(() => jobs.filter((j) => j.techId === meId && j.fecha === day).sort((a, b) => a.hora.localeCompare(b.hora)), [jobs, meId, day]);
}

const mapsUrl = (lat: number, lon: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

/* ---------- Hoy ---------- */
function Hoy() {
  const me = useMe();
  const jobs = useMyJobs();
  const maps = useMaps();
  const push = useUi((s) => s.appPush);
  const clockIn = useDemo((s) => s.clockIn);
  const notifs = useDemo((s) => s.notifs);
  const lastChange = useDemo((s) => s.lastChange);
  const now = useNow(1000);
  const h = new Date(now).getHours();
  const saludo = h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
  const pendientes = jobs.filter((j) => j.estado !== "finalizado" && j.estado !== "facturado");
  const next = [...pendientes].sort((a, b) => (a.prioridad === "alta" ? -1 : 0) - (b.prioridad === "alta" ? -1 : 0) || a.hora.localeCompare(b.hora))[0];
  const worked = me.fichajeInicio ? now - me.fichajeInicio - me.pausaAcumMin * 60e3 - (me.pausaInicio ? now - me.pausaInicio : 0) : 0;
  const nc = next ? maps.client[next.clientId] : undefined;
  const novedades = notifs.filter((n) => n.to === "app").slice(0, 2);

  return (
    <div className="pb-6">
      <div className="px-5 pt-2 pb-3">
        <div className="text-[13px] font-medium text-fg-3 capitalize">{fmt.dayLong(now)}</div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[28px] leading-tight font-semibold tracking-tight">
            {saludo}, {me.nombre.split(" ")[0]}
          </h1>
          <button onClick={() => push({ screen: "notificaciones" })} className="relative grid size-10 place-items-center rounded-full bg-surface shadow-e1" aria-label="Notificaciones">
            <Bell className="size-5" />
            {notifs.some((n) => n.to === "app" && !n.leida) && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-bad" />}
          </button>
        </div>
      </div>

      {/* fichaje */}
      <div className="px-4">
        {me.estado === "fuera" ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-e1">
            <span className="grid size-10 place-items-center rounded-xl bg-sun-soft text-sun">
              <Clock className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">Aún no has fichado</div>
              <div className="text-[13px] text-fg-3">Tu jornada empieza a las 8:00</div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => clockIn(me.id)} className="h-10 rounded-xl bg-brand px-4 text-[14px] font-semibold text-brand-ink" data-tour="app-fichar">
              Fichar
            </motion.button>
          </div>
        ) : (
          <button onClick={() => push({ screen: "fichar" })} className="flex w-full items-center gap-3 rounded-2xl bg-surface p-3.5 text-left shadow-e1">
            <span className={cn("grid size-10 place-items-center rounded-xl", me.estado === "pausa" ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok")}>
              {me.estado === "pausa" ? <Coffee className="size-5" /> : <Clock className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-fg-3">{me.estado === "pausa" ? "En pausa" : `Trabajando desde las ${fmt.time(me.fichajeInicio!)}`}</div>
              <div className="font-display text-[22px] font-semibold tabular">{fmt.clock(worked)}</div>
            </div>
            <ChevronRight className="size-4 text-fg-3" />
          </button>
        )}
      </div>

      {/* siguiente */}
      {next && nc && (
        <div className="mt-4 px-4">
          <div className="mb-1.5 px-1 text-[13px] font-medium text-fg-3">{next.estado === "en-curso" ? "Ahora mismo" : "Siguiente parada"}</div>
          <motion.div
            key={lastChange?.ids.includes(next.id) ? `${next.id}-${lastChange.ts}` : next.id}
            initial={lastChange?.ids.includes(next.id) ? { scale: 0.97, boxShadow: "0 0 0 3px var(--sun)" } : false}
            animate={{ scale: 1, boxShadow: "0 0 0 0px var(--sun)" }}
            transition={{ duration: 1.2 }}
            className="overflow-hidden rounded-2xl bg-surface shadow-e2"
          >
            <button onClick={() => push({ screen: "trabajo", params: { id: next.id } })} className="block w-full p-4 text-left" data-tour="app-next-job">
              <div className="flex items-center gap-2">
                <span className="tabular text-[15px] font-semibold">{next.hora}</span>
                {next.prioridad === "alta" && <UrgencyBadge u="alta" />}
                <span className="ml-auto">
                  <JobStatusBadge s={next.estado} />
                </span>
              </div>
              <div className="mt-2 font-display text-[21px] leading-tight font-semibold">{nc.nombre}</div>
              <div className="mt-0.5 text-[14px] text-fg-2">{next.titulo}</div>
              <div className="mt-2 flex items-center gap-1.5 text-[13px] text-fg-3">
                <MapPin className="size-3.5" /> {nc.direccion}
              </div>
              {next.notasOficina && <div className="mt-2.5 rounded-xl bg-warn-soft px-3 py-2 text-[13px] text-warn">{next.notasOficina}</div>}
            </button>
            <div className="grid grid-cols-2 border-t border-line">
              <a href={mapsUrl(nc.lat, nc.lon)} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center gap-2 border-r border-line text-[15px] font-medium text-brand">
                <Navigation className="size-4" /> Cómo llegar
              </a>
              <button onClick={() => push({ screen: "trabajo", params: { id: next.id } })} className="flex h-12 items-center justify-center gap-2 text-[15px] font-medium text-brand">
                <Wrench className="size-4" /> Ver trabajo
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* acciones */}
      <div className="mt-4 grid grid-cols-4 gap-2 px-4">
        {(
          [
            ["qr", QrCode, "Escanear"],
            ["gasto", Receipt, "Gasto"],
            ["incidencia", AlertTriangle, "Incidencia"],
            ["vacaciones", Palmtree, "Vacaciones"],
          ] as [AppScreen, typeof QrCode, string][]
        ).map(([s, I, l]) => (
          <motion.button whileTap={{ scale: 0.94 }} key={s} onClick={() => push({ screen: s })} className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface py-3 text-[12px] font-medium shadow-e1">
            <I className="size-5 text-brand" />
            {l}
          </motion.button>
        ))}
      </div>

      {/* día */}
      <div className="mt-5 px-4">
        <div className="mb-1.5 flex items-baseline justify-between px-1">
          <span className="text-[13px] font-medium text-fg-3">Tu día</span>
          <span className="text-[13px] text-fg-3 tabular">
            {jobs.filter((j) => j.estado === "finalizado" || j.estado === "facturado").length} de {jobs.length} hechos
          </span>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-surface shadow-e1">
          <AnimatePresence initial={false}>
            {jobs.map((j) => {
              const c = maps.client[j.clientId];
              const done = j.estado === "finalizado" || j.estado === "facturado";
              return (
                <motion.button layout initial={{ opacity: 0, height: 0, backgroundColor: "var(--sun-soft)" }} animate={{ opacity: 1, height: "auto", backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 0.6 }} key={j.id} onClick={() => push({ screen: "trabajo", params: { id: j.id } })} className="flex w-full items-center gap-3 border-b border-line/70 px-3.5 py-3 text-left last:border-0">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2", done ? "border-ok bg-ok text-white" : j.estado === "en-curso" ? "border-brand" : "border-line-strong")}>
                    {done ? <Check className="size-3.5" /> : j.estado === "en-curso" ? <span className="size-2.5 animate-pulse rounded-full bg-brand" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[15px]", done && "text-fg-3 line-through decoration-fg-3/40")}>{c.nombre}</span>
                    <span className="block truncate text-[13px] text-fg-3">
                      {j.hora}, {j.titulo}
                    </span>
                  </span>
                  {j.prioridad === "alta" && !done && <span className="size-2 rounded-full bg-bad" />}
                  <ChevronRight className="size-4 text-fg-3" />
                </motion.button>
              );
            })}
          </AnimatePresence>
          {!jobs.length && <div className="p-6 text-center text-sm text-fg-3">Hoy no tienes trabajos asignados</div>}
        </div>
      </div>

      {!!novedades.length && (
        <Group title="Novedades" className="mt-5">
          {novedades.map((n) => (
            <Row key={n.id} icon={<Bell className="size-4" />} tone="bg-brand-soft text-brand" title={n.titulo} sub={n.texto} right={<span className="text-[11px] text-fg-3">{fmt.ago(n.ts, now)}</span>} />
          ))}
        </Group>
      )}
    </div>
  );
}

/* ---------- Ruta ---------- */
function Ruta() {
  const jobs = useMyJobs();
  const maps = useMaps();
  const me = useMe();
  const push = useUi((s) => s.appPush);
  const stops = optimizeOrder(jobs.map((j) => ({ ...maps.client[j.clientId], job: j })));
  return (
    <div className="pb-6">
      <AppHeader title="Ruta de hoy" sub={`${stops.length} paradas, orden optimizado`} back={false} />
      <div className="mx-4 overflow-hidden rounded-2xl shadow-e1">
        <MallorcaMap
          className="h-64"
          fit={[BASE, ...stops]}
          routes={[{ id: "me", color: me.color, points: [BASE, ...stops, BASE], width: 5 }]}
          markers={[
            { id: "base", kind: "base", lat: BASE.lat, lon: BASE.lon },
            ...stops.map((s, i) => ({ id: s.job.id, kind: "job" as const, lat: s.lat, lon: s.lon, n: i + 1, color: me.color, done: s.job.estado === "finalizado" || s.job.estado === "facturado", active: s.job.estado === "en-curso" })),
            ...(me.estado !== "fuera" ? [{ id: "me", kind: "tech" as const, lat: me.lat, lon: me.lon, color: me.color, label: me.nombre, pulse: true }] : []),
          ]}
          onMarkerClick={(id) => jobs.some((j) => j.id === id) && push({ screen: "trabajo", params: { id } })}
        />
      </div>
      <Group className="mt-4">
        {stops.map((s, i) => (
          <div key={s.job.id} className="flex items-center gap-3 border-b border-line/70 px-3.5 py-3 last:border-0">
            <span className="grid size-7 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: me.color, opacity: s.job.estado === "finalizado" ? 0.4 : 1 }}>
              {i + 1}
            </span>
            <button onClick={() => push({ screen: "trabajo", params: { id: s.job.id } })} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[15px]">{s.nombre}</span>
              <span className="block truncate text-[13px] text-fg-3">
                {s.job.hora}, {s.municipio}
              </span>
            </button>
            <a href={mapsUrl(s.lat, s.lon)} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full bg-brand text-brand-ink" aria-label={`Navegar a ${s.nombre}`}>
              <Navigation className="size-4" />
            </a>
          </div>
        ))}
      </Group>
    </div>
  );
}

/* ---------- Detalle de trabajo ---------- */
function Trabajo({ params }: P) {
  const job = useDemo((s) => s.jobs.find((j) => j.id === params.id));
  const jobs = useDemo((s) => s.jobs);
  const setStatus = useDemo((s) => s.setJobStatus);
  const me = useMe();
  const clockIn = useDemo((s) => s.clockIn);
  const maps = useMaps();
  const sector = useSector();
  const push = useUi((s) => s.appPush);
  const now = useNow(1000);
  if (!job) return <AppHeader title="Trabajo no encontrado" />;
  const c = maps.client[job.clientId];
  const inst = job.installationId ? maps.inst[job.installationId] : undefined;
  const hist = jobs.filter((j) => j.clientId === job.clientId && j.id !== job.id && (j.estado === "facturado" || j.estado === "finalizado")).slice(-3).reverse();
  const done = job.estado === "finalizado" || job.estado === "facturado";

  return (
    <div className="pb-8">
      <AppHeader title={c.nombre} sub={`${job.codigo}, ${job.titulo}`} right={<JobStatusBadge s={job.estado} />} />
      <div className="grid gap-4">
        <div className="mx-4 grid grid-cols-3 gap-2">
          <a href={`tel:${c.telefono.replace(/\s/g, "")}`} className="flex flex-col items-center gap-1 rounded-2xl bg-surface py-3 text-[12px] font-medium text-brand shadow-e1">
            <Phone className="size-5" /> Llamar
          </a>
          <a href={mapsUrl(c.lat, c.lon)} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-2xl bg-surface py-3 text-[12px] font-medium text-brand shadow-e1">
            <Navigation className="size-5" /> Navegar
          </a>
          <button onClick={() => push({ screen: "chat", params: { job: job.id } })} className="flex flex-col items-center gap-1 rounded-2xl bg-surface py-3 text-[12px] font-medium text-brand shadow-e1">
            <MessageCircle className="size-5" /> Oficina
          </button>
        </div>

        <div className="px-4">
          {done ? (
            <div className="flex items-center gap-3 rounded-2xl bg-ok-soft p-4 text-ok">
              <CheckCheck className="size-6" />
              <div>
                <div className="text-[15px] font-semibold">Parte cerrado</div>
                <div className="text-[13px] opacity-90">Informe enviado al cliente con fotos y firma.</div>
              </div>
            </div>
          ) : me.estado === "fuera" ? (
            <BigButton variant="sun" onClick={() => clockIn(me.id)} tour="app-fichar">
              <LogIn className="size-5" /> Fichar entrada para empezar
            </BigButton>
          ) : job.estado === "asignado" || job.estado === "pendiente" ? (
            <BigButton onClick={() => setStatus(job.id, "en-camino")} tour="app-salgo">
              <Navigation className="size-5" /> Salgo hacia allí
            </BigButton>
          ) : job.estado === "en-camino" ? (
            <BigButton onClick={() => setStatus(job.id, "en-curso")} tour="app-empezar">
              <Play className="size-5" /> He llegado, empezar
            </BigButton>
          ) : (
            <div className="grid gap-2">
              <div className="flex items-center justify-center gap-2 text-[13px] text-fg-2">
                <span className="size-2 animate-pulse rounded-full bg-brand" /> Trabajando {job.inicio ? fmt.clock(now - job.inicio) : ""}
              </div>
              <BigButton onClick={() => push({ screen: "parte", params: { id: job.id } })} tour="app-abrir-parte">
                <FileText className="size-5" /> Rellenar parte
              </BigButton>
            </div>
          )}
          {job.estado === "asignado" && me.estado !== "fuera" && <p className="mt-2 text-center text-[12px] text-fg-3">El cliente recibe un aviso de que vas de camino.</p>}
        </div>

        <Group title="Dónde">
          <Row icon={<MapPin className="size-4" />} title={c.direccion} sub={`${c.contacto}, ${c.telefono}`} />
          {inst && <Row icon={<QrCode className="size-4" />} title={inst.nombre} sub={`${sector.instalacion.tipo}, ${inst.marca}, ${inst.codigo}`} onClick={() => push({ screen: "qr" })} />}
          <Row icon={<Clock className="size-4" />} title={`${fmt.date(job.fecha)} a las ${job.hora}`} sub={`Duración prevista ${fmt.dur(job.duracionMin)}`} />
        </Group>

        {(job.notasOficina || c.notas) && (
          <Group title="Notas de la oficina">
            <div className="p-3.5 text-[14px]">{job.notasOficina ?? c.notas}</div>
          </Group>
        )}

        {!!hist.length && (
          <Group title="Últimas visitas a este cliente">
            {hist.map((h) => (
              <Row key={h.id} icon={<History className="size-4" />} title={h.titulo} sub={`${fmt.date(h.fecha)}, ${h.techId ? maps.tech[h.techId].nombre : ""}`} />
            ))}
          </Group>
        )}
        <div className="px-4">
          <button onClick={() => push({ screen: "incidencia", params: { client: c.id } })} className="w-full py-2 text-center text-[14px] text-brand">
            Pedir presupuesto o abrir incidencia
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Fichar ---------- */
function Fichar() {
  const me = useMe();
  const clockIn = useDemo((s) => s.clockIn);
  const pause = useDemo((s) => s.togglePause);
  const out = useDemo((s) => s.clockOut);
  const entries = useDemo((s) => s.timeEntries);
  const now = useNow(1000);
  const worked = me.fichajeInicio ? now - me.fichajeInicio - me.pausaAcumMin * 60e3 - (me.pausaInicio ? now - me.pausaInicio : 0) : 0;
  const mine = entries.filter((e) => e.techId === me.id).slice(-5).reverse();
  const toMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  const semana = entries.filter((e) => e.techId === me.id && e.fecha >= isoDay(addDays(new Date(), -7))).reduce((s, e) => s + toMin(e.salida) - toMin(e.entrada) - e.pausaMin, 0);
  return (
    <div className="pb-6">
      <AppHeader title="Fichar" back={false} sub={fmt.dayLong(now)} />
      <div className="mx-4 grid place-items-center gap-1 rounded-3xl bg-surface py-7 shadow-e1">
        <div className="relative grid size-44 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--surface-2)" strokeWidth="6" />
            <motion.circle cx="50" cy="50" r="45" fill="none" stroke={me.estado === "pausa" ? "var(--warn)" : "var(--brand)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={283} animate={{ strokeDashoffset: 283 - Math.min(1, worked / (8 * 3600e3)) * 283 }} />
          </svg>
          <div className="text-center">
            <div className="font-display text-[30px] font-semibold tabular">{fmt.clock(worked)}</div>
            <div className="text-[12px] text-fg-3">de 8 h</div>
          </div>
        </div>
        <Badge tone={me.estado === "trabajando" ? "ok" : me.estado === "pausa" ? "warn" : "neutral"} dot>
          {me.estado === "trabajando" ? "Trabajando" : me.estado === "pausa" ? "En pausa" : "Fuera de jornada"}
        </Badge>
        <div className="mt-1 flex items-center gap-1 text-[12px] text-fg-3">
          <MapPin className="size-3" /> Ubicación registrada al fichar
        </div>
      </div>
      <div className="mt-4 grid gap-2 px-4">
        {me.estado === "fuera" ? (
          <BigButton onClick={() => clockIn(me.id)} tour="app-fichar">
            <LogIn className="size-5" /> Fichar entrada
          </BigButton>
        ) : (
          <>
            <BigButton variant="secondary" onClick={() => pause(me.id)}>
              {me.estado === "pausa" ? <Play className="size-5" /> : <Coffee className="size-5" />}
              {me.estado === "pausa" ? "Volver de la pausa" : "Empezar pausa"}
            </BigButton>
            <BigButton variant="bad" onClick={() => out(me.id)}>
              <LogOut className="size-5" /> Fichar salida
            </BigButton>
          </>
        )}
      </div>
      <Group title={`Esta semana: ${fmt.num(semana / 60, 1)} h`} className="mt-5">
        {mine.map((e) => (
          <Row key={e.id} title={<span className="capitalize">{fmt.dayName(e.fecha)} {fmt.dateShort(e.fecha)}</span>} sub={`${e.entrada} a ${e.salida}, pausa ${e.pausaMin} min`} right={<span className="tabular text-[14px] font-medium">{fmt.num((toMin(e.salida) - toMin(e.entrada) - e.pausaMin) / 60, 1)} h</span>} />
        ))}
      </Group>
    </div>
  );
}

/* ---------- QR ---------- */
function Qr() {
  const jobs = useMyJobs();
  const maps = useMaps();
  const installations = useDemo((s) => s.installations);
  const allJobs = useDemo((s) => s.jobs);
  const push = useUi((s) => s.appPush);
  const sector = useSector();
  const [found, setFound] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFound(true), 1800);
    return () => clearTimeout(t);
  }, []);
  const target = jobs.find((j) => j.estado === "en-curso" || j.estado === "en-camino") ?? jobs[0];
  const inst = (target?.installationId && maps.inst[target.installationId]) || installations[0];
  const hist = allJobs.filter((j) => j.installationId === inst.id && (j.estado === "facturado" || j.estado === "finalizado")).slice(-3).reverse();
  return (
    <div className="pb-6">
      <AppHeader title="Escanear código" />
      <div className="relative mx-4 aspect-square overflow-hidden rounded-3xl bg-[#0b1115]">
        <FakePhoto seed="qr-scene" className="absolute inset-0 rounded-none opacity-60" tint={sector.color} />
        <div className="absolute inset-[18%] rounded-3xl border-[3px] border-white/80" />
        {!found && <motion.div className="absolute inset-x-[18%] h-0.5 bg-sun shadow-[0_0_12px_var(--sun)]" initial={{ top: "18%" }} animate={{ top: "82%" }} transition={{ duration: 1.1, repeat: Infinity, repeatType: "reverse" }} />}
        <AnimatePresence>
          {found && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-ok text-white">
                <Check className="size-8" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-3 text-center text-[13px] text-white/80">{found ? `Código ${inst.codigo}` : "Apunta al código del equipo"}</div>
      </div>
      <AnimatePresence>
        {found && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-4">
            <Group>
              <Row icon={<QrCode className="size-4" />} tone="bg-brand-soft text-brand" title={inst.nombre} sub={`${maps.client[inst.clientId]?.nombre}, ${inst.marca}`} />
              <Row icon={<CalendarDays className="size-4" />} title={`Última revisión ${fmt.date(inst.ultimaRevision)}`} sub={`Instalada el ${fmt.date(inst.instalada)}`} />
            </Group>
            <Group title="Historial del equipo">
              {hist.map((h) => (
                <Row key={h.id} icon={<History className="size-4" />} title={h.titulo} sub={fmt.date(h.fecha)} />
              ))}
              {!hist.length && <div className="p-3.5 text-[13px] text-fg-3">Primera intervención registrada en este equipo.</div>}
            </Group>
            {target && (
              <div className="px-4">
                <BigButton onClick={() => push({ screen: "trabajo", params: { id: target.id } })}>Ir al trabajo de hoy</BigButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Gasto ---------- */
function Gasto() {
  const me = useMe();
  const add = useDemo((s) => s.addExpense);
  const pop = useUi((s) => s.appBack);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  useEffect(() => {
    if (step === 1) {
      const t = setTimeout(() => setStep(2), 1600);
      return () => clearTimeout(t);
    }
  }, [step]);
  return (
    <div className="pb-6">
      <AppHeader title="Nuevo gasto" sub="Haz una foto al ticket y listo" />
      <div className="px-4">
        {step === 0 && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)} className="grid aspect-[3/4] w-full place-items-center rounded-3xl border-2 border-dashed border-line-strong bg-surface">
            <span className="grid place-items-center gap-2 text-fg-2">
              <span className="grid size-16 place-items-center rounded-full bg-brand text-brand-ink">
                <Camera className="size-7" />
              </span>
              Hacer foto del ticket
            </span>
          </motion.button>
        )}
        {step >= 1 && step < 3 && (
          <div className="grid gap-4">
            <div className="relative mx-auto w-56 overflow-hidden rounded-xl bg-white p-4 font-mono text-[10px] leading-tight text-[#333] shadow-e2">
              <div className="text-center font-bold">ESTACIÓN SON CASTELLÓ</div>
              <div className="mt-2">{fmt.date(new Date())} {fmt.time(new Date())}</div>
              <div className="mt-2 flex justify-between"><span>Gasóleo A 38,2 L</span><span>57,30</span></div>
              <div className="mt-2 flex justify-between border-t border-dashed pt-1 font-bold"><span>TOTAL</span><span>57,30 €</span></div>
              {step === 1 && <motion.div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-ai/40 to-transparent" initial={{ top: "-20%" }} animate={{ top: "100%" }} transition={{ duration: 0.8, repeat: Infinity }} />}
            </div>
            {step === 1 ? (
              <div className="flex items-center justify-center gap-2 text-[14px] text-ai">
                <Sparkles className="size-4" /> Leyendo el ticket…
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3">
                <Group>
                  <Row title="Proveedor" right={<span className="text-[15px]">Estación Son Castelló</span>} />
                  <Row title="Categoría" right={<span className="text-[15px]">Combustible</span>} />
                  <Row title="Total" right={<span className="text-[15px] font-semibold tabular">57,30 €</span>} />
                </Group>
                <BigButton
                  onClick={() => {
                    add(me.id, "Estación de servicio Son Castelló", "Combustible", 47.36);
                    setStep(3);
                  }}
                >
                  Guardar gasto
                </BigButton>
              </motion.div>
            )}
          </div>
        )}
        {step === 3 && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid place-items-center gap-3 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-ok text-white">
              <Check className="size-8" />
            </span>
            <div className="text-[17px] font-semibold">Gasto enviado a la oficina</div>
            <BigButton variant="secondary" onClick={pop} className="mt-4">
              Volver
            </BigButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ---------- Documentos y nóminas ---------- */
function Docs() {
  const me = useMe();
  const payslips = useDemo((s) => s.payslips);
  const markRead = useDemo((s) => s.markPayslipRead);
  const [open, setOpen] = useState<string | null>(null);
  const mine = payslips.filter((p) => p.techId === me.id).sort((a, b) => b.mes.localeCompare(a.mes));
  const p = mine.find((x) => x.id === open);
  return (
    <div className="pb-6">
      <AppHeader title="Mis documentos" />
      <Group title="Nóminas">
        {mine.map((x) => (
          <Row
            key={x.id}
            icon={<FileText className="size-4" />}
            tone="bg-bad-soft text-bad"
            title={<span className="capitalize">Nómina de {fmt.monthName(`${x.mes}-15`)}</span>}
            sub={x.leida ? `Leída el ${fmt.date(x.leida)}` : "Nueva"}
            right={!x.leida ? <span className="size-2.5 rounded-full bg-brand" /> : undefined}
            onClick={() => {
              markRead(x.id);
              setOpen(x.id);
            }}
          />
        ))}
      </Group>
      <Group title="Contrato y certificados" className="mt-4">
        {["Contrato de trabajo", "Certificado de retenciones", "Entrega de equipos de protección"].map((d) => (
          <Row key={d} icon={<FileText className="size-4" />} title={d} sub="PDF" onClick={() => setOpen(d)} />
        ))}
      </Group>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="absolute inset-x-0 top-[60px] bottom-0 z-40 rounded-t-3xl bg-surface p-4 shadow-e3">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-strong" />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[16px] font-semibold capitalize">{p ? `Nómina de ${fmt.monthName(`${p.mes}-15`)}` : open}</span>
              <button onClick={() => setOpen(null)} className="text-[15px] text-brand">
                Cerrar
              </button>
            </div>
            <div className="grid gap-2 rounded-xl border border-line bg-white p-4 text-[11px] text-[#333]">
              <div className="font-semibold">Documento de la gestoría</div>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-2 rounded bg-[#eef2f4]" style={{ width: `${55 + ((i * 37) % 40)}%` }} />
              ))}
              <div className="mt-2 text-[10px] text-[#7a8893]">Vista previa de ejemplo. Solo tú puedes ver este documento.</div>
            </div>
            {p && (
              <div className="mt-3 flex items-center gap-2 text-[13px] text-ok">
                <CheckCheck className="size-4" /> La oficina ya sabe que la has recibido.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Vacaciones ---------- */
function Vacaciones() {
  const me = useMe();
  const absences = useDemo((s) => s.absences);
  const request = useDemo((s) => s.requestAbsence);
  const lastChange = useDemo((s) => s.lastChange);
  const base = startOfDay(addDays(new Date(), 21));
  const [desde, setDesde] = useState(isoDay(base));
  const [hasta, setHasta] = useState(isoDay(addDays(base, 4)));
  const mine = absences.filter((a) => a.techId === me.id).sort((a, b) => b.solicitada - a.solicitada);
  const usados = 7 + (hashString(me.id) % 4);
  return (
    <div className="pb-6">
      <AppHeader title="Vacaciones" />
      <div className="mx-4 grid grid-cols-3 gap-2">
        {[
          ["Te quedan", String(23 - usados)],
          ["Disfrutados", String(usados)],
          ["Pendientes", String(mine.filter((a) => a.estado === "pendiente").length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-surface p-3 text-center shadow-e1">
            <div className="font-display text-[24px] font-semibold">{v}</div>
            <div className="text-[12px] text-fg-3">{k}</div>
          </div>
        ))}
      </div>
      <Group title="Pedir días" className="mt-4">
        <label className="flex items-center justify-between border-b border-line/70 px-3.5 py-2.5 text-[15px]">
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-transparent text-right text-brand outline-none" />
        </label>
        <label className="flex items-center justify-between px-3.5 py-2.5 text-[15px]">
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-transparent text-right text-brand outline-none" />
        </label>
      </Group>
      <div className="mt-3 px-4">
        <BigButton onClick={() => request(me.id, desde, hasta < desde ? desde : hasta)} tour="app-pedir-vacaciones">
          <Send className="size-5" /> Enviar solicitud
        </BigButton>
      </div>
      <Group title="Mis solicitudes" className="mt-5">
        <AnimatePresence initial={false}>
          {mine.map((a) => {
            const flash = lastChange?.ids.includes(a.id) && Date.now() - lastChange.ts < 2500;
            return (
              <motion.div key={flash ? `${a.id}-${lastChange?.ts}` : a.id} initial={flash ? { backgroundColor: "var(--sun-soft)" } : false} animate={{ backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 1.5 }}>
                <Row icon={<Palmtree className="size-4" />} tone={a.estado === "aprobada" ? "bg-ok-soft text-ok" : a.estado === "pendiente" ? "bg-sun-soft text-sun" : "bg-bad-soft text-bad"} title={`${fmt.dateShort(a.desde)} al ${fmt.dateShort(a.hasta)}`} sub={<span className="capitalize">{a.tipo}</span>} right={<Badge tone={a.estado === "aprobada" ? "ok" : a.estado === "pendiente" ? "sun" : "bad"}>{a.estado === "aprobada" ? "Aprobada" : a.estado === "pendiente" ? "Pendiente" : "Rechazada"}</Badge>} />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!mine.length && <div className="p-4 text-center text-[13px] text-fg-3">Aún no has pedido vacaciones</div>}
      </Group>
    </div>
  );
}

/* ---------- Turnos ---------- */
function Turnos() {
  const me = useMe();
  const monday = addDays(startOfDay(new Date()), -((new Date().getDay() + 6) % 7));
  return (
    <div className="pb-6">
      <AppHeader title="Mis turnos" sub="Semana actual" />
      <Group>
        {Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((d) => {
          const h = hashString(me.id + isoDay(d)) % 10;
          const t = d.getDay() === 0 ? (h < 2 ? "Guardia" : "Libre") : d.getDay() === 6 ? (h < 3 ? "Mañana" : "Libre") : h < 6 ? "Mañana" : h < 9 ? "Partido" : "Tarde";
          const hr = { Mañana: "7:00 a 15:00", Partido: "8:00 a 13:00, 15:00 a 18:00", Tarde: "12:00 a 20:00", Guardia: "Disponible 24 h", Libre: "" }[t];
          return <Row key={d.toISOString()} title={<span className={cn("capitalize", isoDay(d) === isoDay(new Date()) && "font-semibold text-brand")}>{fmt.dayName(d)} {d.getDate()}</span>} sub={hr} right={<Badge tone={t === "Libre" ? "neutral" : t === "Guardia" ? "sun" : "brand"}>{t}</Badge>} />;
        })}
      </Group>
    </div>
  );
}

/* ---------- Comunicados ---------- */
function Comunicados() {
  const me = useMe();
  const coms = useDemo((s) => s.comunicados);
  const read = useDemo((s) => s.readComunicado);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="pb-6">
      <AppHeader title="Comunicados" />
      <div className="grid gap-3 px-4">
        {coms.map((c) => {
          const unread = !c.leidos.includes(me.id);
          return (
            <button
              key={c.id}
              onClick={() => {
                setOpen(open === c.id ? null : c.id);
                read(c.id, me.id);
              }}
              className="rounded-2xl bg-surface p-4 text-left shadow-e1"
            >
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-brand" />
                <span className="flex-1 text-[15px] font-semibold">{c.titulo}</span>
                {unread && <span className="size-2.5 rounded-full bg-brand" />}
              </div>
              <div className="mt-0.5 text-[12px] text-fg-3">{fmt.date(c.fecha)}</div>
              <AnimatePresence>
                {open === c.id && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2 text-[14px] text-fg-2">
                    {c.texto}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Chat ---------- */
function Chat({ params }: P) {
  const me = useMe();
  const chats = useDemo((s) => s.chats);
  const send = useDemo((s) => s.sendChat);
  const [msg, setMsg] = useState("");
  const thread = chats.filter((c) => c.techId === me.id);
  const stack = useUi((s) => s.appStack);
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader title="Oficina" sub="Marga te responde en horario de oficina" back={stack.length > 1} />
      <div className="flex flex-1 flex-col gap-2 px-4 pb-3">
        {thread.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("max-w-[80%] rounded-[20px] px-3.5 py-2 text-[15px]", m.from === "tecnico" ? "ml-auto rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md bg-surface shadow-e1")}>
            {m.texto}
            <div className={cn("text-right text-[10px]", m.from === "tecnico" ? "opacity-70" : "text-fg-3")}>{fmt.time(m.ts)}</div>
          </motion.div>
        ))}
        {!thread.length && <div className="m-auto text-[14px] text-fg-3">Escribe a la oficina</div>}
      </div>
      <form
        className="sticky bottom-0 flex gap-2 border-t border-line bg-surface/95 p-3 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          if (!msg.trim()) return;
          send(me.id, "tecnico", msg.trim(), params.job);
          setMsg("");
        }}
      >
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Mensaje" className="h-10 flex-1 rounded-full bg-surface-2 px-4 text-[15px] outline-none" aria-label="Mensaje" />
        <button type="submit" className="grid size-10 place-items-center rounded-full bg-brand text-brand-ink" aria-label="Enviar">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

/* ---------- Notificaciones ---------- */
function Notificaciones() {
  const notifs = useDemo((s) => s.notifs);
  const mark = useDemo((s) => s.markNotifsRead);
  const push = useUi((s) => s.appPush);
  useEffect(() => {
    const t = setTimeout(() => mark("app"), 1200);
    return () => clearTimeout(t);
  }, [mark]);
  const list = notifs.filter((n) => n.to === "app");
  return (
    <div className="pb-6">
      <AppHeader title="Notificaciones" />
      <Group>
        {list.map((n) => (
          <Row
            key={n.id}
            icon={<Bell className="size-4" />}
            tone={n.leida ? "bg-surface-2 text-fg-3" : "bg-brand-soft text-brand"}
            title={n.titulo}
            sub={n.texto}
            right={<span className="text-[11px] text-fg-3">{fmt.ago(n.ts)}</span>}
            onClick={n.href?.startsWith("j") ? () => push({ screen: "trabajo", params: { id: n.href! } }) : undefined}
          />
        ))}
        {!list.length && <div className="p-6 text-center text-[13px] text-fg-3">Nada nuevo</div>}
      </Group>
    </div>
  );
}

/* ---------- Incidencia ---------- */
function Incidencia({ params }: P) {
  const clients = useDemo((s) => s.clients);
  const create = useDemo((s) => s.createIncidencia);
  const addReq = useDemo((s) => s.addWebRequest);
  const pop = useUi((s) => s.appBack);
  const [tipo, setTipo] = useState<"incidencia" | "presupuesto">("presupuesto");
  const [cid, setCid] = useState(params.client ?? clients[0].id);
  const [txt, setTxt] = useState("");
  const [foto, setFoto] = useState(false);
  const [ok, setOk] = useState(false);
  if (ok)
    return (
      <div className="grid min-h-full place-items-center p-6 text-center">
        <div className="grid place-items-center gap-3">
          <span className="grid size-16 place-items-center rounded-full bg-ok text-white">
            <Check className="size-8" />
          </span>
          <div className="text-[17px] font-semibold">Enviado a la oficina</div>
          <BigButton variant="secondary" onClick={pop}>
            Volver
          </BigButton>
        </div>
      </div>
    );
  return (
    <div className="pb-6">
      <AppHeader title="Desde campo" sub="Pide un presupuesto o avisa de un problema" />
      <div className="mx-4 grid grid-cols-2 rounded-xl bg-surface-2 p-1">
        {(["presupuesto", "incidencia"] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)} className={cn("h-9 rounded-lg text-[14px] font-medium", tipo === t ? "bg-surface shadow-e1" : "text-fg-3")}>
            {t === "presupuesto" ? "Presupuesto" : "Incidencia"}
          </button>
        ))}
      </div>
      <Group className="mt-4">
        <label className="flex items-center justify-between gap-2 border-b border-line/70 px-3.5 py-2.5 text-[15px]">
          Cliente
          <select value={cid} onChange={(e) => setCid(e.target.value)} className="max-w-[60%] bg-transparent text-right text-brand outline-none">
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={tipo === "presupuesto" ? "El cliente quiere cambiar el termo del piso de arriba…" : "Falta una pieza, el cliente no estaba…"} className="h-28 w-full resize-none bg-transparent px-3.5 py-3 text-[15px] outline-none" aria-label="Descripción" />
      </Group>
      <div className="mt-3 px-4">
        {foto ? (
          <FakePhoto seed={`inc-${cid}`} className="aspect-video" label="Foto adjunta" />
        ) : (
          <button onClick={() => setFoto(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-[15px] text-brand">
            <Camera className="size-5" /> Añadir foto
          </button>
        )}
      </div>
      <div className="mt-4 px-4">
        <BigButton
          onClick={() => {
            const c = clients.find((x) => x.id === cid)!;
            if (tipo === "incidencia") create(cid, txt || "Incidencia registrada desde campo");
            else addReq(c.contacto, c.telefono, `Presupuesto pedido desde campo para ${c.nombre}: ${txt || "ver foto adjunta"}`, "web");
            setOk(true);
          }}
        >
          Enviar
        </BigButton>
      </div>
    </div>
  );
}

/* ---------- Más ---------- */
function Mas() {
  const push = useUi((s) => s.appPush);
  const offline = useUi((s) => s.offline);
  const setOffline = useUi((s) => s.setOffline);
  const me = useMe();
  const payslips = useDemo((s) => s.payslips);
  const coms = useDemo((s) => s.comunicados);
  const nuevas = payslips.filter((p) => p.techId === me.id && !p.leida).length;
  const sinLeer = coms.filter((c) => !c.leidos.includes(me.id)).length;
  const items: [AppScreen, ReactNode, string, string, number?][] = [
    ["docs", <FileText key="d" className="size-4" />, "Nóminas y documentos", "bg-bad-soft text-bad", nuevas],
    ["vacaciones", <Palmtree key="v" className="size-4" />, "Vacaciones y ausencias", "bg-ok-soft text-ok"],
    ["turnos", <CalendarDays key="t" className="size-4" />, "Mis turnos", "bg-info-soft text-info"],
    ["comunicados", <Megaphone key="c" className="size-4" />, "Comunicados", "bg-sun-soft text-sun", sinLeer],
    ["gasto", <Receipt key="g" className="size-4" />, "Gastos con foto", "bg-ai-soft text-ai"],
    ["qr", <ScanLine key="q" className="size-4" />, "Escanear equipo", "bg-brand-soft text-brand"],
    ["incidencia", <AlertTriangle key="i" className="size-4" />, "Presupuesto o incidencia", "bg-warn-soft text-warn"],
    ["notificaciones", <Bell key="n" className="size-4" />, "Notificaciones", "bg-surface-2 text-fg-2"],
  ];
  return (
    <div className="pb-6">
      <AppHeader title="Más" back={false} />
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-e1">
        <Avatar name={me.nombre} color={me.color} size={44} />
        <div>
          <div className="text-[16px] font-semibold">{me.nombre}</div>
          <div className="text-[13px] text-fg-3">{me.rol}</div>
        </div>
      </div>
      <Group>
        {items.map(([s, icon, label, tone, badge]) => (
          <Row key={s} icon={icon} tone={tone} title={label} onClick={() => push({ screen: s })} right={badge ? <span className="flex items-center gap-2"><span className="grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1.5 text-[11px] font-bold text-white">{badge}</span><ChevronRight className="size-4 text-fg-3" /></span> : undefined} />
        ))}
      </Group>
      <Group title="Demostración" className="mt-5">
        <div className="flex items-center gap-3 px-3.5 py-3">
          <span className={cn("grid size-8 place-items-center rounded-[10px]", offline ? "bg-bad-soft text-bad" : "bg-surface-2 text-fg-2")}>{offline ? <WifiOff className="size-4" /> : <Wifi className="size-4" />}</span>
          <span className="flex-1 text-[15px]">Simular sin cobertura</span>
          <button role="switch" aria-checked={offline} aria-label="Simular sin cobertura" onClick={() => setOffline(!offline)} className={cn("relative h-[30px] w-[50px] rounded-full transition-colors", offline ? "bg-ok" : "bg-line-strong")}>
            <motion.span layout className={cn("absolute top-[2px] size-[26px] rounded-full bg-white shadow", offline ? "right-[2px]" : "left-[2px]")} />
          </button>
        </div>
      </Group>
      <p className="mt-4 px-6 text-center text-[12px] text-fg-3">Nexo Campo se instala desde el navegador, sin pasar por la tienda de aplicaciones.</p>
    </div>
  );
}

export const APP_SCREENS: Record<AppScreen, ComponentType<P>> = {
  hoy: Hoy,
  ruta: Ruta,
  trabajo: Trabajo,
  parte: Parte,
  qr: Qr,
  fichar: Fichar,
  gasto: Gasto,
  docs: Docs,
  nominas: Docs,
  vacaciones: Vacaciones,
  turnos: Turnos,
  comunicados: Comunicados,
  chat: Chat,
  notificaciones: Notificaciones,
  incidencia: Incidencia,
  mas: Mas,
};

export { AppHeader as Header, Group, Row, BigButton, useMe };
