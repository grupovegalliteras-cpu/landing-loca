"use client";

import { Check, Clock, Fuel, Navigation, Route as RouteIcon, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useDemo } from "@/store/demo";
import { kmToMin, optimizeOrder, routeKm, useMaps } from "@/lib/hooks";
import { cn, fmt, isoDay } from "@/lib/utils";
import { AnimatedNumber, Avatar, Button, Card, JobStatusBadge, Segmented } from "@/components/ui";
import { MallorcaMap, type MapMarker, type MapRoute } from "@/components/mallorca-map";
import { BASE } from "@/data/seed";
import { PageHeader } from "../shell";
import { JobDrawer } from "./trabajos";

export function Rutas() {
  const jobs = useDemo((s) => s.jobs);
  const techs = useDemo((s) => s.techs);
  const assign = useDemo((s) => s.assignJob);
  const maps = useMaps();
  const hoy = isoDay(new Date());
  const [techId, setTechId] = useState<string>("todos");
  const [modo, setModo] = useState<"optimizada" | "original">("optimizada");
  const [open, setOpen] = useState<string>();
  const [applied, setApplied] = useState<Record<string, boolean>>({});

  const perTech = useMemo(() => {
    return techs.map((t) => {
      const list = jobs.filter((j) => j.techId === t.id && j.fecha === hoy).sort((a, b) => a.hora.localeCompare(b.hora));
      const stops = list.map((j) => ({ ...maps.client[j.clientId], job: j }));
      const optimized = optimizeOrder(stops);
      // orden "original": el que haría alguien a ojo, con un par de paradas cruzadas
      const original = [...optimized];
      if (original.length >= 3) [original[0], original[1]] = [original[1], original[0]];
      if (original.length >= 4) [original[2], original[3]] = [original[3], original[2]];
      const kmO = routeKm([BASE, ...original, BASE]);
      const kmN = routeKm([BASE, ...optimized, BASE]);
      return { t, stops, original, optimized, kmO, kmN: Math.min(kmN, kmO) };
    });
  }, [jobs, techs, maps, hoy]);

  const total = perTech.reduce((s, p) => ({ o: s.o + p.kmO, n: s.n + p.kmN }), { o: 0, n: 0 });
  const sel = perTech.find((p) => p.t.id === techId);

  const routes: MapRoute[] = (sel ? [sel] : perTech).map((p) => ({
    id: `${p.t.id}-${modo}`,
    color: p.t.color,
    points: [BASE, ...(modo === "optimizada" ? p.optimized : p.original), BASE],
    dashed: modo === "original",
    width: sel ? 4.5 : 3,
    opacity: sel ? 0.95 : 0.7,
  }));

  const markers: MapMarker[] = [
    { id: "base", kind: "base", lat: BASE.lat, lon: BASE.lon },
    ...(sel ? [sel] : perTech).flatMap((p) =>
      (modo === "optimizada" ? p.optimized : p.original).map((s, i) => ({
        id: s.job.id,
        kind: sel ? ("client" as const) : ("job" as const),
        lat: s.lat,
        lon: s.lon,
        color: p.t.color,
        n: i + 1,
        label: sel ? s.nombre : undefined,
        done: s.job.estado === "finalizado" || s.job.estado === "facturado",
        active: s.job.estado === "en-curso",
      })),
    ),
    ...techs.filter((t) => t.estado !== "fuera" && (!sel || t.id === sel.t.id)).map((t) => ({ id: `tech-${t.id}`, kind: "tech" as const, lat: t.lat, lon: t.lon, color: t.color, label: t.nombre, pulse: true })),
  ];

  const fit = sel ? [BASE, ...sel.stops] : undefined;

  const aplicar = () => {
    if (!sel) return;
    const horas = sel.stops.map((s) => s.job.hora).sort();
    sel.optimized.forEach((s, i) => {
      if (s.job.estado === "asignado") assign(s.job.id, sel.t.id, s.job.fecha, horas[i]);
    });
    setApplied((a) => ({ ...a, [sel.t.id]: true }));
  };

  return (
    <div className="pb-8">
      <PageHeader id="rutas" actions={<Segmented value={modo} onChange={setModo} options={[{ value: "optimizada", label: "Ruta optimizada" }, { value: "original", label: "Orden original" }]} />} />
      <div className="grid gap-4 px-4 sm:px-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-ai">
              <Sparkles className="size-3.5" /> Ahorro de hoy con rutas optimizadas
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <div className="font-display text-2xl font-semibold">
                  <AnimatedNumber value={Math.max(0, total.o - total.n)} format={(n) => fmt.int(n)} />
                  <span className="text-sm font-normal text-fg-3"> km</span>
                </div>
                <div className="text-[11px] text-fg-3">menos</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold">
                  <AnimatedNumber value={kmToMin(Math.max(0, total.o - total.n))} />
                  <span className="text-sm font-normal text-fg-3"> min</span>
                </div>
                <div className="text-[11px] text-fg-3">de conducción</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold">
                  <AnimatedNumber value={Math.max(0, total.o - total.n) * 0.11} format={(n) => fmt.eur0(n)} />
                </div>
                <div className="text-[11px] text-fg-3">de gasoil</div>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-fg-3">Estimación con distancias por carretera aproximadas y un consumo medio de furgoneta.</div>
          </Card>

          <Card className="overflow-hidden">
            <button onClick={() => setTechId("todos")} className={cn("flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left text-[13px]", techId === "todos" ? "bg-brand-soft/60 font-semibold" : "hover:bg-surface-2")}>
              <RouteIcon className="size-4 text-fg-3" /> Todo el equipo
            </button>
            {perTech.map((p) => (
              <button key={p.t.id} onClick={() => setTechId(p.t.id)} className={cn("flex w-full items-center gap-3 border-b border-line/70 px-4 py-2.5 text-left last:border-0", techId === p.t.id ? "bg-brand-soft/60" : "hover:bg-surface-2")}>
                <Avatar name={p.t.nombre} color={p.t.color} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{p.t.nombre}</div>
                  <div className="text-[11px] text-fg-3">{p.stops.length ? `${p.stops.length} paradas, ${fmt.int(p.kmN)} km` : "Sin paradas hoy"}</div>
                </div>
                {p.kmO - p.kmN > 1 && <span className="rounded bg-ok-soft px-1.5 py-0.5 text-[11px] font-medium text-ok">-{fmt.int(p.kmO - p.kmN)} km</span>}
              </button>
            ))}
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card className="relative overflow-hidden">
            <MallorcaMap className="h-[420px] sm:h-[520px]" markers={markers} routes={routes} fit={fit} onMarkerClick={(id) => jobs.some((j) => j.id === id) && setOpen(id)} />
            {sel && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute top-3 left-3 flex flex-wrap gap-2">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-e2 backdrop-blur">
                  <div>
                    <div className="text-[11px] text-fg-3">Antes</div>
                    <div className="tabular text-sm font-semibold text-fg-2 line-through decoration-bad/60">{fmt.int(sel.kmO)} km, {fmt.dur(kmToMin(sel.kmO))}</div>
                  </div>
                  <div className="h-8 w-px bg-line" />
                  <div>
                    <div className="text-[11px] text-fg-3">Optimizada</div>
                    <div className="tabular text-sm font-semibold text-ok">{fmt.int(sel.kmN)} km, {fmt.dur(kmToMin(sel.kmN))}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
          {sel && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
                <div className="text-[13px] font-semibold">Paradas de {sel.t.nombre}</div>
                <Button size="sm" variant={applied[sel.t.id] ? "secondary" : "primary"} onClick={aplicar} disabled={applied[sel.t.id] || sel.kmO - sel.kmN < 0.5}>
                  {applied[sel.t.id] ? (
                    <>
                      <Check className="size-3.5" /> Ruta aplicada y enviada a la app
                    </>
                  ) : (
                    <>
                      <Navigation className="size-3.5" /> Aplicar ruta optimizada
                    </>
                  )}
                </Button>
              </div>
              <ol className="divide-y divide-line/70">
                {(modo === "optimizada" ? sel.optimized : sel.original).map((s, i) => (
                  <li key={s.job.id}>
                    <button onClick={() => setOpen(s.job.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2">
                      <span className="grid size-6 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: sel.t.color }}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{s.nombre}</div>
                        <div className="truncate text-[11px] text-fg-3">
                          {s.direccion}, {s.job.titulo}
                        </div>
                      </div>
                      <span className="tabular flex items-center gap-1 text-xs text-fg-3">
                        <Clock className="size-3" />
                        {s.job.hora}
                      </span>
                      <JobStatusBadge s={s.job.estado} />
                    </button>
                  </li>
                ))}
                {!sel.stops.length && <li className="px-4 py-8 text-center text-sm text-fg-3">Sin paradas hoy.</li>}
              </ol>
              <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[11px] text-fg-3">
                <Fuel className="size-3.5" /> Salida y vuelta a {BASE.nombre}
              </div>
            </Card>
          )}
        </div>
      </div>
      <JobDrawer jobId={open} onClose={() => setOpen(undefined)} />
    </div>
  );
}
