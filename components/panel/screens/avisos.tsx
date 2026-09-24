"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Globe, Mail, MessageCircle, Pause, Phone, PhoneIncoming, Play, Sparkles, UserCheck, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LIVE_SPEED, useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { useMaps, useNow } from "@/lib/hooks";
import { cn, fmt, haversineKm, isoDay } from "@/lib/utils";
import { Avatar, Badge, Button, Card, UrgencyBadge, inputCls } from "@/components/ui";
import type { Aviso } from "@/data/types";
import type { Canal } from "@/data/sectors";
import { PageHeader } from "../shell";
import { usePanelNav } from "../nav";

export const CANAL: Record<Canal, { label: string; icon: typeof Phone; cls: string }> = {
  llamada: { label: "Llamada", icon: Phone, cls: "bg-brand-soft text-brand" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, cls: "bg-ok-soft text-ok" },
  email: { label: "Email", icon: Mail, cls: "bg-info-soft text-info" },
  web: { label: "Web", icon: Globe, cls: "bg-ai-soft text-ai" },
};


export function Avisos() {
  const avisos = useDemo((s) => s.avisos);
  const simulateCall = useDemo((s) => s.simulateCall);
  const simulateWhatsapp = useDemo((s) => s.simulateWhatsapp);
  const focus = useUi((s) => s.panelFocus);
  const maps = useMaps();
  const now = useNow(15000);
  const [filter, setFilter] = useState<"todos" | "nuevos" | "urgentes" | "llamada" | "whatsapp">("nuevos");
  const [sel, setSel] = useState<string | undefined>(focus);

  const list = useMemo(() => {
    return avisos.filter((a) => {
      if (filter === "nuevos") return a.estado === "nuevo";
      if (filter === "urgentes") return a.urgencia === "alta";
      if (filter === "llamada") return a.canal === "llamada";
      if (filter === "whatsapp") return a.canal === "whatsapp";
      return true;
    });
  }, [avisos, filter]);

  const newest = avisos[0];
  useEffect(() => {
    if (newest?.enDirecto) {
      setSel(newest.id);
      setFilter((f) => (f === "urgentes" || f === "whatsapp" || f === "llamada" ? "todos" : f));
    }
  }, [newest?.id, newest?.enDirecto]);
  useEffect(() => {
    if (focus) setSel(focus);
  }, [focus]);

  const current = avisos.find((a) => a.id === sel) ?? list[0];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        id="central-avisos"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => simulateWhatsapp()}>
              <MessageCircle className="size-3.5 text-ok" />
              Simular WhatsApp
            </Button>
            <Button size="sm" variant="sun" onClick={() => simulateCall()} data-tour="simular-llamada">
              <PhoneIncoming className="size-3.5" />
              Simular llamada
            </Button>
          </>
        }
      />
      <div className="grid min-h-0 flex-1 gap-4 px-4 pb-6 sm:px-6 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <Card className="flex min-h-[420px] flex-col overflow-hidden" data-tour="aviso-list">
          <div className="flex flex-wrap items-center gap-1 border-b border-line px-2.5 py-2">
            {(
              [
                ["nuevos", "Sin asignar"],
                ["urgentes", "Urgentes"],
                ["llamada", "Llamadas"],
                ["whatsapp", "WhatsApp"],
                ["todos", "Todos"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={cn("h-7 rounded-md px-2 text-xs font-medium", filter === k ? "bg-fg text-bg" : "text-fg-2 hover:bg-surface-2")}>
                {l}
                <span className="tabular ml-1 opacity-60">
                  {k === "nuevos" ? avisos.filter((a) => a.estado === "nuevo").length : k === "urgentes" ? avisos.filter((a) => a.urgencia === "alta").length : k === "todos" ? avisos.length : avisos.filter((a) => a.canal === k).length}
                </span>
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto scroll-thin">
            <AnimatePresence initial={false}>
              {list.map((a) => {
                const C = CANAL[a.canal];
                const client = a.clientId ? maps.client[a.clientId] : undefined;
                return (
                  <motion.button
                    layout
                    key={a.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => setSel(a.id)}
                    className={cn(
                      "relative block w-full border-b border-line/70 px-3.5 py-3 text-left transition-colors",
                      current?.id === a.id ? "bg-brand-soft/60" : "hover:bg-surface-2/70",
                    )}
                  >
                    {current?.id === a.id && <span className="absolute inset-y-0 left-0 w-0.5 bg-brand" />}
                    <div className="flex items-center gap-2">
                      <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", C.cls)}>
                        <C.icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{client?.nombre ?? a.contacto}</span>
                      {a.enDirecto ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-sun">
                          <Wave />
                          En directo
                        </span>
                      ) : (
                        <span className="text-[11px] text-fg-3">{fmt.ago(a.recibido, now)}</span>
                      )}
                    </div>
                    <p className={cn("mt-1 line-clamp-2 pl-8 text-xs", a.estado === "nuevo" ? "text-fg" : "text-fg-3")}>{a.enDirecto ? "Transcribiendo la llamada…" : a.resumen}</p>
                    {!a.enDirecto && (
                      <div className="mt-2 flex flex-wrap gap-1 pl-8">
                        <UrgencyBadge u={a.urgencia} />
                        <Badge>{a.tipo}</Badge>
                        {a.estado === "convertido" && <Badge tone="ok">Orden creada</Badge>}
                        {a.estado === "descartado" && <Badge>Descartado</Badge>}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {!list.length && (
              <div className="grid place-items-center gap-2 px-6 py-16 text-center">
                <div className="grid size-10 place-items-center rounded-xl bg-ok-soft text-ok">
                  <Check className="size-5" />
                </div>
                <div className="text-sm font-medium">Bandeja al día</div>
                <p className="text-xs text-fg-3">Todos los avisos tienen su orden de trabajo.</p>
              </div>
            )}
          </div>
        </Card>
        {current ? <AvisoDetail key={current.id} a={current} /> : <Card className="grid place-items-center text-sm text-fg-3">Selecciona un aviso</Card>}
      </div>
    </div>
  );
}

function Wave({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-3 items-center gap-[2px]", className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="w-[2px] rounded-full bg-current" animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }} />
      ))}
    </span>
  );
}

function AvisoDetail({ a }: { a: Aviso }) {
  const maps = useMaps();
  const sector = useSector();
  const techs = useDemo((s) => s.techs);
  const jobs = useDemo((s) => s.jobs);
  const avisos = useDemo((s) => s.avisos);
  const meId = useDemo((s) => s.meId);
  const convert = useDemo((s) => s.convertAviso);
  const discard = useDemo((s) => s.discardAviso);
  const { go } = usePanelNav();
  const client = a.clientId ? maps.client[a.clientId] : undefined;
  const C = CANAL[a.canal];
  const serv = sector.servicios[a.servicio];
  const job = a.jobId ? jobs.find((j) => j.id === a.jobId) : undefined;
  const hoy = isoDay(new Date());

  // transcripción en directo
  const [elapsed, setElapsed] = useState(() => (a.enDirecto ? Date.now() - a.recibido : Infinity));
  useEffect(() => {
    if (!a.enDirecto) {
      setElapsed(Infinity);
      return;
    }
    const t = setInterval(() => setElapsed(Date.now() - a.recibido), 60);
    return () => clearInterval(t);
  }, [a.enDirecto, a.recibido]);

  const recomendado = useMemo(() => {
    const cands = techs.filter((t) => !jobs.some((j) => j.techId === t.id && j.fecha === hoy) || t.estado !== "fuera" || t.id === meId);
    const scored = cands
      .filter((t) => t.id !== "t6")
      .map((t) => {
        const km = client ? haversineKm(t.id === meId ? { lat: 39.575, lon: 2.62 } : t, client) * 1.3 : 20;
        const carga = jobs.filter((j) => j.techId === t.id && j.fecha === hoy && j.estado !== "finalizado" && j.estado !== "facturado").length;
        return { t, km, carga, score: km + carga * 6 - (t.id === meId ? 30 : 0) };
      })
      .sort((x, y) => x.score - y.score);
    return scored[0];
  }, [techs, jobs, client, meId, hoy]);

  const [techId, setTechId] = useState<string>(recomendado?.t.id ?? meId);
  const [fecha, setFecha] = useState(hoy);
  const nowD = new Date();
  const defHora = `${String(Math.min(19, nowD.getHours() + 1)).padStart(2, "0")}:00`;
  const [hora, setHora] = useState(defHora);
  useEffect(() => {
    if (recomendado) setTechId(recomendado.t.id);
  }, [recomendado?.t.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const historial = avisos.filter((x) => x.clientId && x.clientId === a.clientId && x.id !== a.id).slice(0, 4);
  const classified = !a.enDirecto;

  return (
    <div className="@container min-w-0">
    <div className="grid min-w-0 content-start gap-4 @3xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3.5">
          <span className={cn("grid size-10 place-items-center rounded-xl", C.cls)}>
            <C.icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">{client?.nombre ?? a.contacto}</div>
            <div className="text-xs text-fg-3">
              {a.contacto}, {a.telefono}. {C.label} {fmt.time(a.recibido)}
              {a.duracionSeg ? `, ${Math.floor(a.duracionSeg / 60)} min ${a.duracionSeg % 60} s` : ""}
            </div>
          </div>
          {a.enDirecto ? (
            <Badge tone="sun" className="h-7 px-2">
              <Wave /> Grabando y transcribiendo
            </Badge>
          ) : (
            client && <Badge tone="ok"><UserCheck className="size-3" /> Cliente reconocido</Badge>
          )}
        </div>

        <div className="border-b border-line px-4 py-3" data-tour="aviso-ia">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ai">
            <Sparkles className="size-3.5" />
            {classified ? "Clasificado automáticamente" : "Analizando la conversación…"}
          </div>
          {classified ? (
            <motion.div initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.09 } } }} className="grid gap-2 sm:grid-cols-4">
              {[
                ["Tipo", <span key="t" className="capitalize">{a.tipo}</span>],
                ["Urgencia", <UrgencyBadge key="u" u={a.urgencia} />],
                ["Cliente", client?.nombre ?? "Nuevo contacto"],
                ["Servicio propuesto", serv?.nombre],
              ].map(([k, v]) => (
                <motion.div key={String(k)} variants={{ h: { opacity: 0, y: 6, filter: "blur(4px)" }, s: { opacity: 1, y: 0, filter: "blur(0px)" } }} className="rounded-lg bg-ai-soft/60 px-2.5 py-2">
                  <div className="text-[11px] text-fg-3">{k}</div>
                  <div className="mt-0.5 truncate text-[13px] font-medium">{v}</div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-[46px]" />
              ))}
            </div>
          )}
          <AnimatePresence>
            {classified && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3 rounded-lg border border-line px-3 py-2 text-[13px]">
                <span className="text-fg-3">Resumen: </span>
                {a.resumen}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Transcript a={a} elapsed={elapsed} />
      </Card>

      <div className="grid content-start gap-4">
        <Card className="p-4" data-tour="aviso-convert">
          {a.estado === "convertido" && job ? (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-ok">
                <Check className="size-4" /> Orden de trabajo creada
              </div>
              <div className="rounded-lg bg-surface-2 p-3 text-[13px]">
                <div className="font-semibold">{job.codigo}</div>
                <div className="text-fg-2">{job.titulo}</div>
                <div className="mt-2 flex items-center gap-2">
                  {job.techId && <Avatar name={maps.tech[job.techId].nombre} color={maps.tech[job.techId].color} size={22} />}
                  <span className="text-xs text-fg-2">
                    {job.techId ? maps.tech[job.techId].nombre : "Sin asignar"}, {fmt.date(job.fecha)} a las {job.hora}
                  </span>
                </div>
              </div>
              <Button variant="secondary" onClick={() => go("trabajos", job.id)}>
                <Wrench className="size-4" /> Ver la orden
              </Button>
            </div>
          ) : a.estado === "descartado" ? (
            <div className="text-sm text-fg-3">Aviso descartado. No requiere visita.</div>
          ) : (
            <div className="grid gap-3">
              <div className="text-sm font-semibold">Crear orden de trabajo</div>
              {recomendado && (
                <div className="flex items-start gap-2 rounded-lg bg-ai-soft/60 p-2.5 text-xs">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />
                  <span>
                    <b>{recomendado.t.nombre}</b> es quien mejor encaja: zona {recomendado.t.zona}, a unos {Math.max(8, Math.round((recomendado.km / 45) * 60))} min del cliente
                    {recomendado.carga ? ` y con ${recomendado.carga} trabajos más hoy.` : " y con la tarde libre."}
                  </span>
                </div>
              )}
              <label className="grid gap-1 text-xs text-fg-2">
                Técnico
                <select className={inputCls} value={techId} onChange={(e) => setTechId(e.target.value)} disabled={!classified}>
                  {techs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({t.zona})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-xs text-fg-2">
                  Día
                  <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </label>
                <label className="grid gap-1 text-xs text-fg-2">
                  Hora
                  <input type="time" className={inputCls} value={hora} onChange={(e) => setHora(e.target.value)} />
                </label>
              </div>
              <Button variant="primary" size="lg" disabled={!classified} onClick={() => convert(a.id, techId, { fecha, hora })} data-tour="aviso-convert-btn">
                <Wrench className="size-4" />
                Crear y asignar
              </Button>
              <button className="text-xs text-fg-3 hover:text-fg" onClick={() => discard(a.id)}>
                <X className="mr-1 inline size-3" />
                Descartar, no necesita visita
              </button>
            </div>
          )}
        </Card>

        {client && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Ficha del cliente</div>
              <button className="text-xs text-brand hover:underline" onClick={() => go("clientes", client.id)}>
                Abrir
              </button>
            </div>
            <div className="mt-2 grid gap-1 text-[13px]">
              <div className="text-fg-2">{client.direccion}</div>
              <div className="text-fg-2">
                {client.tipo}, cliente desde {fmt.date(client.desde)}
              </div>
              {client.notas && <div className="mt-1 rounded-md bg-warn-soft px-2 py-1.5 text-xs text-warn">{client.notas}</div>}
            </div>
            {!!historial.length && (
              <>
                <div className="mt-3 mb-1 text-xs font-medium text-fg-3">Conversaciones anteriores</div>
                <div className="grid gap-1.5">
                  {historial.map((h) => {
                    const HC = CANAL[h.canal];
                    return (
                      <div key={h.id} className="flex items-start gap-2 text-xs">
                        <HC.icon className="mt-0.5 size-3.5 shrink-0 text-fg-3" />
                        <span className="line-clamp-2 text-fg-2">{h.resumen}</span>
                        <span className="ml-auto shrink-0 text-fg-3">{fmt.dateShort(h.recibido)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
    </div>
  );
}

function Transcript({ a, elapsed }: { a: Aviso; elapsed: number }) {
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(-1);
  const [prog, setProg] = useState(0);
  const cancelled = useRef(false);
  const live = elapsed !== Infinity;
  const total = a.lineas.length ? a.lineas[a.lineas.length - 1].t + 4 : 10;

  useEffect(() => () => {
    cancelled.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const play = () => {
    if (playing) {
      cancelled.current = true;
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }
    cancelled.current = false;
    setPlaying(true);
    const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
    const voices = synth?.getVoices().filter((v) => v.lang.startsWith("es")) ?? [];
    const esES = voices.filter((v) => v.lang === "es-ES");
    const pool = esES.length ? esES : voices;
    const speakLine = (i: number) => {
      if (cancelled.current || i >= a.lineas.length) {
        setPlaying(false);
        setCur(-1);
        setProg(0);
        return;
      }
      setCur(i);
      setProg(a.lineas[i].t / total);
      const l = a.lineas[i];
      if (synth && pool.length) {
        const u = new SpeechSynthesisUtterance(l.texto);
        u.lang = "es-ES";
        u.voice = pool[l.speaker === "oficina" ? 0 : Math.min(1, pool.length - 1)] ?? null;
        u.pitch = l.speaker === "oficina" ? 1.15 : 0.9;
        u.rate = 1.08;
        u.onend = () => speakLine(i + 1);
        u.onerror = () => speakLine(i + 1);
        synth.speak(u);
      } else {
        setTimeout(() => speakLine(i + 1), Math.max(1600, l.texto.length * 55));
      }
    };
    speakLine(0);
  };

  const bars = useMemo(() => Array.from({ length: 64 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7 + a.id.length) * Math.cos(i * 0.37)) * 0.75), [a.id]);

  return (
    <div className="px-4 py-3.5">
      {a.canal === "llamada" && (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
          <button
            onClick={play}
            disabled={live}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-fg text-bg transition hover:scale-105 disabled:opacity-40"
            aria-label={playing ? "Pausar grabación" : "Escuchar grabación"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
          </button>
          <div className="flex h-8 flex-1 items-center gap-[2px]" aria-hidden>
            {bars.map((h, i) => {
              const p = i / bars.length;
              const liveP = live ? Math.min(1, elapsed / 1000 / (total * LIVE_SPEED)) : 0;
              const on = live ? p <= liveP : playing && p <= prog;
              return <span key={i} className={cn("flex-1 rounded-full transition-colors", on ? (live ? "bg-sun" : "bg-brand") : "bg-line-strong")} style={{ height: `${h * 100}%` }} />;
            })}
          </div>
          <span className="tabular w-10 text-right text-xs text-fg-3">{Math.floor(total / 60)}:{String(Math.round(total % 60)).padStart(2, "0")}</span>
        </div>
      )}
      <div className="mb-2 text-xs font-medium text-fg-3">{a.canal === "llamada" ? "Transcripción" : "Conversación"}</div>
      <div className="grid gap-2">
        {a.lineas.map((l, i) => {
          const showAt = l.t * LIVE_SPEED * 1000;
          if (live && elapsed < showAt) return null;
          const nextAt = (a.lineas[i + 1]?.t ?? l.t + 3) * LIVE_SPEED * 1000;
          const partial = live && elapsed < nextAt ? Math.min(1, (elapsed - showAt) / Math.max(400, (nextAt - showAt) * 0.8)) : 1;
          const text = partial < 1 ? l.texto.slice(0, Math.ceil(l.texto.length * partial)) : l.texto;
          const isOffice = l.speaker === "oficina";
          return (
            <motion.div key={i} initial={live ? { opacity: 0, y: 4 } : false} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-2.5", isOffice && "flex-row-reverse text-right")}>
              <span className={cn("mt-0.5 w-10 shrink-0 text-[11px] tabular text-fg-3", isOffice && "text-right")}>
                0:{String(Math.round(l.t)).padStart(2, "0")}
              </span>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed transition-colors",
                  isOffice ? "rounded-tr-md bg-surface-2" : "rounded-tl-md border border-line",
                  cur === i && "bg-brand-soft ring-1 ring-brand/40",
                )}
              >
                <div className="mb-0.5 text-[11px] font-medium text-fg-3">{isOffice ? "Oficina" : a.contacto}</div>
                {text}
                {partial < 1 && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-fg" />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
