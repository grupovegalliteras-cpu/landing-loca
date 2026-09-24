"use client";

import { AlertTriangle, ChevronLeft, ChevronRight, GripVertical, Inbox } from "lucide-react";
import { useMemo, useState } from "react";
import { useDemo } from "@/store/demo";
import { useMaps } from "@/lib/hooks";
import { addDays, cn, fmt, isoDay, startOfDay } from "@/lib/utils";
import { Avatar, Badge, Button, Card, Segmented } from "@/components/ui";
import type { Job } from "@/data/types";
import { PageHeader } from "../shell";
import { JobDrawer } from "./trabajos";

const toMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const toHora = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function overlaps(jobs: Job[]) {
  const set = new Set<string>();
  const byKey = new Map<string, Job[]>();
  jobs.forEach((j) => {
    if (!j.techId) return;
    const k = `${j.techId}|${j.fecha}`;
    byKey.set(k, [...(byKey.get(k) ?? []), j]);
  });
  byKey.forEach((list) => {
    const s = [...list].sort((a, b) => toMin(a.hora) - toMin(b.hora));
    for (let i = 1; i < s.length; i++) {
      if (toMin(s[i].hora) < toMin(s[i - 1].hora) + s[i - 1].duracionMin) {
        set.add(s[i].id);
        set.add(s[i - 1].id);
      }
    }
  });
  return set;
}

const STATUS_BG: Record<string, string> = {
  pendiente: "bg-surface-2",
  asignado: "bg-info-soft",
  "en-camino": "bg-sun-soft",
  "en-curso": "bg-brand-soft",
  finalizado: "bg-ok-soft",
  facturado: "bg-ai-soft",
};

export function Planificacion() {
  const jobs = useDemo((s) => s.jobs);
  const techs = useDemo((s) => s.techs);
  const absences = useDemo((s) => s.absences);
  const assign = useDemo((s) => s.assignJob);
  const lastChange = useDemo((s) => s.lastChange);
  const maps = useMaps();
  const [view, setView] = useState<"semana" | "dia">("semana");
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<string>();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const hoy = isoDay(new Date());

  const monday = useMemo(() => {
    const d = startOfDay(new Date());
    const dow = (d.getDay() + 6) % 7;
    return addDays(d, -dow + offset * 7);
  }, [offset]);
  const days = Array.from({ length: 6 }, (_, i) => isoDay(addDays(monday, i)));
  const dayView = isoDay(addDays(startOfDay(new Date()), offset));
  const solapes = useMemo(() => overlaps(jobs.filter((j) => j.estado !== "facturado" && j.estado !== "finalizado")), [jobs]);
  const sinAsignar = jobs.filter((j) => j.estado === "pendiente");
  const flash = (id: string) => lastChange && lastChange.ids.includes(id) && Date.now() - lastChange.ts < 2500;

  const onDrop = (e: React.DragEvent, techId: string, fecha: string, hora?: string) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/job");
    if (id) assign(id, techId, fecha, hora);
  };

  const Chip = ({ j, compact }: { j: Job; compact?: boolean }) => {
    const c = maps.client[j.clientId];
    const t = j.techId ? maps.tech[j.techId] : undefined;
    const draggable = j.estado === "pendiente" || j.estado === "asignado";
    return (
      <button
        draggable={draggable}
        onDragStart={(e) => e.dataTransfer.setData("text/job", j.id)}
        onClick={() => setOpen(j.id)}
        className={cn(
          "group relative w-full rounded-md border-l-[3px] px-2 py-1 text-left text-[11.5px] leading-tight shadow-e1 transition hover:brightness-[0.98]",
          STATUS_BG[j.estado],
          solapes.has(j.id) && "ring-2 ring-bad/70",
          flash(j.id) && "row-flash",
          draggable && "cursor-grab active:cursor-grabbing",
        )}
        style={{ borderLeftColor: t?.color ?? "var(--border-strong)" }}
        title={`${j.codigo} ${c?.nombre}`}
      >
        <div className="flex items-center gap-1">
          <span className="tabular font-semibold">{j.hora}</span>
          {j.prioridad === "alta" && <span className="size-1.5 rounded-full bg-bad" />}
          {solapes.has(j.id) && <AlertTriangle className="size-3 text-bad" />}
          {draggable && <GripVertical className="ml-auto size-3 text-fg-3 opacity-0 group-hover:opacity-100" />}
        </div>
        <div className="truncate font-medium">{c?.nombre}</div>
        {!compact && <div className="truncate text-fg-3">{j.titulo}</div>}
      </button>
    );
  };

  return (
    <div className="pb-8">
      <PageHeader
        id="planificacion"
        actions={
          <>
            <Segmented value={view} onChange={(v) => { setView(v); setOffset(0); }} options={[{ value: "semana", label: "Semana" }, { value: "dia", label: "Día" }]} />
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" aria-label="Anterior" onClick={() => setOffset((o) => o - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setOffset(0)}>
                Hoy
              </Button>
              <Button size="sm" variant="ghost" aria-label="Siguiente" onClick={() => setOffset((o) => o + 1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6">
        <Card className="flex flex-wrap items-center gap-3 px-3 py-2.5" onDragOver={(e) => e.preventDefault()}>
          <span className="flex items-center gap-1.5 text-[13px] font-medium">
            <Inbox className="size-4 text-fg-3" /> Sin asignar
            <Badge tone={sinAsignar.length ? "sun" : "ok"}>{sinAsignar.length}</Badge>
          </span>
          <span className="text-xs text-fg-3">Arrastra una orden a un técnico y un día.</span>
          <div className="flex w-full gap-2 overflow-x-auto pb-1 no-scrollbar">
            {sinAsignar.map((j) => (
              <div key={j.id} className="w-44 shrink-0">
                <Chip j={j} />
              </div>
            ))}
            {!sinAsignar.length && <span className="text-xs text-ok">Todo el trabajo tiene técnico.</span>}
          </div>
        </Card>

        {solapes.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-bad/30 bg-bad-soft px-3 py-2 text-[13px] text-bad">
            <AlertTriangle className="size-4" /> Hay {solapes.size} órdenes que se solapan en el tiempo. Están marcadas en rojo.
          </div>
        )}

        {view === "semana" ? (
          <Card className="overflow-x-auto scroll-thin">
            <div className="grid min-w-[900px]" style={{ gridTemplateColumns: `180px repeat(${days.length}, minmax(0,1fr))` }}>
              <div className="sticky left-0 z-10 border-b border-line bg-surface" />
              {days.map((d) => (
                <div key={d} className={cn("border-b border-l border-line px-2 py-2 text-xs", d === hoy && "bg-brand-soft/50")}>
                  <div className={cn("font-semibold capitalize", d === hoy && "text-brand")}>{fmt.dayName(d)}</div>
                  <div className="text-fg-3">{fmt.dateShort(d)}</div>
                </div>
              ))}
              {techs.map((t) => (
                <div key={t.id} className="contents">
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
                    <Avatar name={t.nombre} color={t.color} size={26} />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium">{t.nombre}</div>
                      <div className="truncate text-[11px] text-fg-3">{t.zona}</div>
                    </div>
                  </div>
                  {days.map((d) => {
                    const key = `${t.id}|${d}`;
                    const list = jobs.filter((j) => j.techId === t.id && j.fecha === d).sort((a, b) => a.hora.localeCompare(b.hora));
                    const vac = absences.find((a) => a.techId === t.id && a.estado === "aprobada" && a.desde <= d && a.hasta >= d);
                    return (
                      <div
                        key={key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(key);
                        }}
                        onDragLeave={() => setDragOver((k) => (k === key ? null : k))}
                        onDrop={(e) => onDrop(e, t.id, d)}
                        className={cn("min-h-[92px] space-y-1 border-b border-l border-line p-1.5 transition-colors", d === hoy && "bg-brand-soft/20", dragOver === key && "bg-brand-soft outline-2 -outline-offset-2 outline-brand outline-dashed")}
                      >
                        {vac ? (
                          <div className="grid h-full place-items-center rounded-md bg-[repeating-linear-gradient(135deg,var(--surface-2)_0_6px,transparent_6px_12px)] text-[11px] text-fg-3">{vac.tipo === "vacaciones" ? "Vacaciones" : "Ausencia"}</div>
                        ) : (
                          list.map((j) => <Chip key={j.id} j={j} compact />)
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="overflow-x-auto scroll-thin">
            <div className="min-w-[980px]">
              <div className="flex border-b border-line">
                <div className="w-[180px] shrink-0 px-3 py-2 text-xs font-semibold capitalize">{fmt.dayLong(dayView)}</div>
                <div className="relative flex flex-1">
                  {Array.from({ length: 13 }, (_, i) => (
                    <div key={i} className="flex-1 border-l border-line px-1 py-2 text-[11px] text-fg-3 tabular">
                      {String(7 + i).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>
              {techs.map((t) => {
                const list = jobs.filter((j) => j.techId === t.id && j.fecha === dayView);
                const key = `${t.id}|${dayView}`;
                return (
                  <div key={t.id} className="flex border-b border-line last:border-0">
                    <div className="flex w-[180px] shrink-0 items-center gap-2 px-3 py-3">
                      <Avatar name={t.nombre} color={t.color} size={26} />
                      <span className="truncate text-[13px] font-medium">{t.nombre}</span>
                    </div>
                    <div
                      className={cn("relative h-[76px] flex-1", dragOver === key && "bg-brand-soft")}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(key);
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => {
                        const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const mins = 7 * 60 + Math.round((((e.clientX - r.left) / r.width) * 13 * 60) / 30) * 30;
                        onDrop(e, t.id, dayView, toHora(Math.max(7 * 60, Math.min(19 * 60, mins))));
                      }}
                    >
                      {Array.from({ length: 13 }, (_, i) => (
                        <div key={i} className="absolute inset-y-0 border-l border-line/60" style={{ left: `${(i / 13) * 100}%` }} />
                      ))}
                      {dayView === hoy && <NowLine />}
                      {list.map((j) => {
                        const left = ((toMin(j.hora) - 420) / (13 * 60)) * 100;
                        const width = (j.duracionMin / (13 * 60)) * 100;
                        return (
                          <div key={j.id} className="absolute top-2 bottom-2" style={{ left: `${left}%`, width: `${Math.max(width, 7)}%` }}>
                            <Chip j={j} compact />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        <div className="flex flex-wrap gap-3 text-[11px] text-fg-3">
          {Object.entries(STATUS_BG).map(([k, cls]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded", cls)} />
              {k === "en-camino" ? "En camino" : k === "en-curso" ? "En curso" : k[0].toUpperCase() + k.slice(1)}
            </span>
          ))}
        </div>
      </div>
      <JobDrawer jobId={open} onClose={() => setOpen(undefined)} />
    </div>
  );
}

function NowLine() {
  const d = new Date();
  const m = d.getHours() * 60 + d.getMinutes();
  if (m < 420 || m > 1200) return null;
  return (
    <div className="absolute inset-y-0 z-10 w-0.5 bg-sun" style={{ left: `${((m - 420) / 780) * 100}%` }}>
      <span className="absolute -top-1 -left-[3px] size-2 rounded-full bg-sun" />
    </div>
  );
}
