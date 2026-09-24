"use client";

import { AlertTriangle, Bell, CalendarClock, Car, FileWarning, Package, PhoneIncoming, Palmtree, Radio } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { useDemo, useSector } from "@/store/demo";
import { useMaps, useNow } from "@/lib/hooks";
import { addDays, cn, fmt, isoDay, startOfDay } from "@/lib/utils";
import { AnimatedNumber, Avatar, Badge, Card, CardHeader, JobStatusBadge } from "@/components/ui";
import { AreaChart, HBars } from "@/components/charts";
import { MallorcaMap } from "@/components/mallorca-map";
import { BASE } from "@/data/seed";
import { PageHeader } from "../shell";
import { usePanelNav } from "../nav";

export function Direccion() {
  const invoices = useDemo((s) => s.invoices);
  const jobs = useDemo((s) => s.jobs);
  const avisos = useDemo((s) => s.avisos);
  const techs = useDemo((s) => s.techs);
  const activity = useDemo((s) => s.activity);
  const stock = useDemo((s) => s.stock);
  const absences = useDemo((s) => s.absences);
  const contracts = useDemo((s) => s.contracts);
  const vehicles = useDemo((s) => s.vehicles);
  const sector = useSector();
  const maps = useMaps();
  const { go } = usePanelNav();
  const now = useNow(30000);
  const hoy = isoDay(new Date(now));
  const mes = hoy.slice(0, 7);

  const k = useMemo(() => {
    const emit = invoices.filter((i) => i.estado !== "borrador");
    const facturadoMes = emit.filter((i) => i.fecha.startsWith(mes)).reduce((s, i) => s + i.total, 0);
    const mesAnt = isoDay(new Date(new Date(now).getFullYear(), new Date(now).getMonth() - 1, 1)).slice(0, 7);
    const diaMes = new Date(now).getDate();
    const facturadoMesAnt = emit.filter((i) => i.fecha.startsWith(mesAnt) && Number(i.fecha.slice(8)) <= diaMes).reduce((s, i) => s + i.total, 0);
    const cobradoMes = emit.filter((i) => i.cobradaEn && isoDay(new Date(i.cobradaEn)).startsWith(mes)).reduce((s, i) => s + i.total, 0);
    const pendiente = emit.filter((i) => i.estado === "emitida" || i.estado === "vencida").reduce((s, i) => s + i.total, 0);
    const vencido = emit.filter((i) => i.estado === "vencida").reduce((s, i) => s + i.total, 0);
    const hoyJobs = jobs.filter((j) => j.fecha === hoy);
    const hechos = hoyJobs.filter((j) => j.estado === "finalizado" || j.estado === "facturado").length;
    return { facturadoMes, facturadoMesAnt, cobradoMes, pendiente, vencido, hoyJobs, hechos };
  }, [invoices, jobs, mes, hoy, now]);

  const weekly = useMemo(() => {
    // ventanas de 7 días que terminan hoy, para que la última semana esté completa
    const start = startOfDay(addDays(new Date(now), -7 * 13 + 1));
    const out: { x: string; y: number; y2: number }[] = [];
    for (let w = 0; w < 13; w++) {
      const a = isoDay(addDays(start, w * 7));
      const b = isoDay(addDays(start, w * 7 + 7));
      const y = invoices.filter((i) => i.estado !== "borrador" && i.fecha >= a && i.fecha < b).reduce((s, i) => s + i.total, 0);
      const y2 = invoices.filter((i) => i.cobradaEn && isoDay(new Date(i.cobradaEn)) >= a && isoDay(new Date(i.cobradaEn)) < b).reduce((s, i) => s + i.total, 0);
      out.push({ x: a, y, y2 });
    }
    return out;
  }, [invoices, now]);

  const topClientes = useMemo(() => {
    const m = new Map<string, number>();
    invoices.filter((i) => i.estado !== "borrador" && i.fecha.startsWith(String(new Date(now).getFullYear()))).forEach((i) => m.set(i.clientId, (m.get(i.clientId) ?? 0) + i.total));
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, v]) => ({ label: maps.client[id]?.nombre ?? id, value: v }));
  }, [invoices, maps, now]);

  const nuevos = avisos.filter((a) => a.estado === "nuevo");
  const live = avisos.find((a) => a.enDirecto);
  const delta = k.facturadoMesAnt ? ((k.facturadoMes - k.facturadoMesAnt) / k.facturadoMesAnt) * 100 : 0;

  const atencion = [
    nuevos.filter((a) => a.urgencia === "alta").length && { icon: <PhoneIncoming className="size-4" />, tone: "sun", text: `${nuevos.filter((a) => a.urgencia === "alta").length} avisos urgentes sin asignar`, go: "central-avisos" },
    invoices.filter((i) => i.estado === "vencida").length && { icon: <FileWarning className="size-4" />, tone: "bad", text: `${invoices.filter((i) => i.estado === "vencida").length} facturas vencidas, ${fmt.eur0(k.vencido)}`, go: "impagos" },
    invoices.filter((i) => i.estado === "borrador").length && { icon: <FileWarning className="size-4" />, tone: "info", text: `${invoices.filter((i) => i.estado === "borrador").length} facturas en borrador listas para emitir`, go: "facturacion" },
    stock.filter((s) => s.nave < s.minimo).length && { icon: <Package className="size-4" />, tone: "warn", text: `${stock.filter((s) => s.nave < s.minimo).length} artículos por debajo del mínimo`, go: "almacen" },
    absences.filter((a) => a.estado === "pendiente").length && { icon: <Palmtree className="size-4" />, tone: "info", text: `${absences.filter((a) => a.estado === "pendiente").length} solicitudes de vacaciones por aprobar`, go: "vacaciones" },
    contracts.filter((c) => c.estado === "por-renovar").length && { icon: <CalendarClock className="size-4" />, tone: "ai", text: `${contracts.filter((c) => c.estado === "por-renovar").length} contratos se renuevan este mes`, go: "contratos" },
    vehicles.filter((v) => v.itv <= isoDay(addDays(new Date(now), 30))).length && { icon: <Car className="size-4" />, tone: "warn", text: `ITV de ${vehicles.filter((v) => v.itv <= isoDay(addDays(new Date(now), 30))).map((v) => v.matricula).join(", ")} en menos de 30 días`, go: "flota" },
  ].filter(Boolean) as { icon: React.ReactNode; tone: string; text: string; go: string }[];

  return (
    <div className="pb-10">
      <PageHeader
        id="direccion"
        title={`Hoy, ${fmt.dayLong(now)}`}
        desc={`${sector.empresa}: así va la empresa ahora mismo. Todo se actualiza solo.`}
        actions={
          <Badge tone="ok" className="h-7 px-2">
            <span className="relative mr-0.5 flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-ok opacity-60" />
              <span className="relative size-2 rounded-full bg-ok" />
            </span>
            En directo
          </Badge>
        }
      />

      <AnimatePresence>
        {live && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onClick={() => go("central-avisos", live.id)}
            className="mx-4 mb-4 flex w-[calc(100%-2rem)] items-center gap-3 overflow-hidden rounded-xl border border-sun/40 bg-sun-soft px-4 py-3 text-left sm:mx-6 sm:w-[calc(100%-3rem)]"
          >
            <span className="relative grid size-9 place-items-center rounded-full bg-sun text-[#1d1300]">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-sun" />
              <PhoneIncoming className="relative size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold">Llamada en curso: {live.contacto}, {maps.client[live.clientId ?? ""]?.nombre}</span>
              <span className="block text-xs text-fg-2">Se está grabando y transcribiendo. Pulsa para verla en Central Avisos.</span>
            </span>
            <Radio className="size-4 text-sun" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="grid gap-4 px-4 sm:px-6">
        <Card className="grid grid-cols-2 divide-line max-lg:[&>*:nth-child(-n+2)]:border-b lg:grid-cols-4 lg:divide-x [&>*]:border-line">
          <div className="border-r border-line lg:border-r-0">
            <Kpi label="Facturado este mes" value={<AnimatedNumber value={k.facturadoMes} format={fmt.eur0} />} sub={delta >= 0 ? `+${fmt.num(delta, 0)} % frente al mismo día del mes pasado` : `${fmt.eur0(k.facturadoMes / Math.max(1, new Date(now).getDate()))} de media al día`} tone={delta >= 0 ? "ok" : undefined} onClick={() => go("facturacion")} />
          </div>
          <Kpi label="Cobrado este mes" value={<AnimatedNumber value={k.cobradoMes} format={fmt.eur0} />} sub={`${fmt.eur0(k.pendiente)} pendiente de cobro`} onClick={() => go("cobros")} />
          <div className="border-r border-line lg:border-r-0">
            <Kpi label="Trabajos de hoy" value={<><AnimatedNumber value={k.hechos} /><span className="text-fg-3"> / {k.hoyJobs.length}</span></>} sub={`${k.hoyJobs.filter((j) => j.estado === "en-curso").length} en curso ahora`} onClick={() => go("trabajos")} />
          </div>
          <Kpi
            label="Avisos sin asignar"
            value={<AnimatedNumber value={nuevos.length} />}
            sub={nuevos.length ? `El más antiguo ${fmt.ago(Math.min(...nuevos.map((a) => a.recibido)), now)}` : "Todo asignado"}
            tone={nuevos.length ? "sun" : "ok"}
            onClick={() => go("central-avisos")}
          />
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Facturación y cobros" sub="Por semanas, últimos tres meses, IVA incluido" right={<button className="text-xs text-brand hover:underline" onClick={() => go("contabilidad")}>Ver contabilidad</button>} />
            <div className="px-3 pb-3">
              <AreaChart data={weekly} format={(n) => (n >= 1000 ? `${fmt.num(n / 1000, 0)} mil` : fmt.int(n))} label="Facturado" label2="Cobrado" xLabel={(s) => fmt.dateShort(s)} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Necesita tu atención" sub="Lo que el panel ha detectado hoy" />
            <div className="px-2 pb-2">
              {atencion.map((a, i) => (
                <motion.button
                  key={a.text}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => go(a.go)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2"
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", `bg-${a.tone}-soft text-${a.tone}`)}>{a.icon}</span>
                  <span className="text-[13px]">{a.text}</span>
                </motion.button>
              ))}
              {!atencion.length && <div className="px-2 py-8 text-center text-sm text-fg-3">Nada pendiente. Buen día.</div>}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
          <Card className="overflow-hidden">
            <CardHeader title="El equipo ahora" sub={`${techs.filter((t) => t.estado !== "fuera").length} de ${techs.length} trabajando`} right={<button className="text-xs text-brand hover:underline" onClick={() => go("rutas")}>Ver mapa</button>} />
            <div className="divide-y divide-line/70">
              {techs.map((t) => {
                const tj = k.hoyJobs.filter((j) => j.techId === t.id);
                const cur = tj.find((j) => j.estado === "en-curso" || j.estado === "en-camino") ?? tj.find((j) => j.estado === "asignado");
                const vac = absences.some((a) => a.techId === t.id && a.estado === "aprobada" && a.desde <= hoy && a.hasta >= hoy);
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar name={t.nombre} color={t.color} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[13px] font-medium">
                        {t.nombre}
                        <span className={cn("size-1.5 rounded-full", t.estado === "trabajando" ? "bg-ok" : t.estado === "pausa" ? "bg-warn" : "bg-fg-3/40")} />
                      </div>
                      <div className="truncate text-xs text-fg-3">
                        {vac ? "De vacaciones" : t.estado === "fuera" ? "Sin fichar" : cur ? `${maps.client[cur.clientId]?.nombre}` : "Sin trabajos pendientes"}
                      </div>
                    </div>
                    {vac ? <Badge tone="info">Vacaciones</Badge> : t.estado === "pausa" ? <Badge tone="warn">Pausa</Badge> : cur ? <JobStatusBadge s={cur.estado} /> : null}
                    <span className="tabular w-10 text-right text-xs text-fg-3">{tj.filter((j) => j.estado === "finalizado" || j.estado === "facturado").length}/{tj.length}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="overflow-hidden">
            <MallorcaMap
              className="h-full min-h-[300px]"
              markers={[
                { id: "base", kind: "base", lat: BASE.lat, lon: BASE.lon },
                ...k.hoyJobs
                  .filter((j) => j.techId)
                  .map((j) => {
                    const c = maps.client[j.clientId];
                    return { id: j.id, kind: "job" as const, lat: c.lat, lon: c.lon, color: maps.tech[j.techId!]?.color, done: j.estado === "finalizado" || j.estado === "facturado", n: undefined, active: j.estado === "en-curso" };
                  }),
                ...techs.filter((t) => t.estado !== "fuera").map((t) => ({ id: t.id, kind: "tech" as const, lat: t.lat, lon: t.lon, color: t.color, label: t.nombre, pulse: true })),
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="Actividad" sub="En tiempo real" right={<Bell className="size-3.5 text-fg-3" />} />
            <ol className="relative max-h-[330px] space-y-0 overflow-auto px-4 pb-3 scroll-thin">
              <AnimatePresence initial={false}>
                {activity.slice(0, 14).map((a) => (
                  <motion.li key={a.id} layout initial={{ opacity: 0, y: -8, backgroundColor: "var(--sun-soft)" }} animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 0.6 }} className="-mx-2 flex gap-3 rounded-lg px-2 py-2">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.kind === "pago" ? "bg-ok" : a.kind === "aviso" ? "bg-sun" : a.kind === "equipo" ? "bg-info" : a.kind === "factura" ? "bg-ai" : "bg-brand")} />
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-snug">{a.texto}</span>
                      <span className="text-[11px] text-fg-3">{fmt.ago(a.ts, now)}</span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Mejores clientes del año" sub="Facturado, IVA incluido" right={<button className="text-xs text-brand hover:underline" onClick={() => go("rentabilidad")}>Ver rentabilidad</button>} />
            <div className="px-4 pb-4">
              <HBars data={topClientes} format={fmt.eur0} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Trabajos por estado" sub="Hoy y próximos 7 días" />
            <div className="grid grid-cols-3 gap-2 px-4 pb-4 sm:grid-cols-6">
              {(["pendiente", "asignado", "en-camino", "en-curso", "finalizado", "facturado"] as const).map((st) => {
                const n = jobs.filter((j) => j.estado === st && j.fecha >= isoDay(addDays(new Date(now), st === "facturado" || st === "finalizado" ? -7 : 0)) && j.fecha <= isoDay(addDays(new Date(now), 7))).length;
                return (
                  <button key={st} onClick={() => go("trabajos")} className="rounded-lg bg-surface-2 px-2.5 py-2.5 text-left hover:bg-surface-3">
                    <div className="font-display text-xl font-semibold tabular">
                      <AnimatedNumber value={n} />
                    </div>
                    <div className="mt-1">
                      <JobStatusBadge s={st} />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-fg-2">
              <AlertTriangle className="size-3.5 text-warn" />
              Los números de este panel salen de los mismos datos que usa el equipo: nadie tiene que pasarlos a mano.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone, onClick }: { label: string; value: React.ReactNode; sub: string; tone?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="block w-full px-4 py-4 text-left transition hover:bg-surface-2/60">
      <div className="text-xs text-fg-3">{label}</div>
      <div className="mt-1.5 font-display text-[28px] leading-none font-semibold tracking-tight">{value}</div>
      <div className={cn("mt-2 text-xs", tone ? `text-${tone}` : "text-fg-3")}>{sub}</div>
    </button>
  );
}
