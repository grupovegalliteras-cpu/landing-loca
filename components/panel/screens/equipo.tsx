"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCheck, Download, Eye, FileText, Fingerprint, HardHat, MapPin, Megaphone, Send, Tablet, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useDemo } from "@/store/demo";
import { useMaps, useNow } from "@/lib/hooks";
import { addDays, cn, fmt, hashString, isoDay, startOfDay } from "@/lib/utils";
import { AnimatedNumber, Avatar, Badge, Button, Card, CardHeader, DataTable, Modal, Progress, inputCls } from "@/components/ui";
import { downloadText, toCsv } from "@/lib/download";
import { MUNICIPIOS } from "@/data/seed";
import { haversineKm } from "@/lib/utils";
import { PageHeader } from "../shell";

const toMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

function nearestTown(lat: number, lon: number) {
  let best = "Palma";
  let bd = Infinity;
  Object.entries(MUNICIPIOS).forEach(([n, [la, lo]]) => {
    const d = haversineKm({ lat, lon }, { lat: la, lon: lo });
    if (d < bd) {
      bd = d;
      best = n;
    }
  });
  return best;
}

/* ---------------- Fichaje ---------------- */
export function Fichaje() {
  const techs = useDemo((s) => s.techs);
  const entries = useDemo((s) => s.timeEntries);
  const absences = useDemo((s) => s.absences);
  const clockIn = useDemo((s) => s.clockIn);
  const lastChange = useDemo((s) => s.lastChange);
  const maps = useMaps();
  const now = useNow(1000);
  const [tablet, setTablet] = useState(false);
  const [pin, setPin] = useState("");
  const [tabletOk, setTabletOk] = useState<string | null>(null);
  const hoy = isoDay(new Date());

  const rows = useMemo(() => [...entries].sort((a, b) => b.fecha.localeCompare(a.fecha) || a.techId.localeCompare(b.techId)), [entries]);
  const exportar = () => {
    const data: (string | number)[][] = [["Trabajador", "Fecha", "Entrada", "Salida", "Pausas (min)", "Horas efectivas", "Ubicación de entrada"]];
    rows.forEach((e) => data.push([maps.tech[e.techId]?.nombre ?? "", fmt.date(e.fecha), e.entrada, e.salida, e.pausaMin, Math.round(((toMin(e.salida) - toMin(e.entrada) - e.pausaMin) / 60) * 100) / 100, nearestTown(e.lat, e.lon)]));
    downloadText(`registro-jornada-${hoy}.csv`, toCsv(data), "text/csv;charset=utf-8");
  };

  return (
    <div className="pb-8">
      <PageHeader
        id="fichaje"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setTablet(true)}>
              <Tablet className="size-3.5" /> Modo tablet de oficina
            </Button>
            <Button size="sm" variant="primary" onClick={exportar}>
              <Download className="size-3.5" /> Exportar registro de jornada
            </Button>
          </>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-tour="fichaje-board">
          {techs.map((t) => {
            const vac = absences.some((a) => a.techId === t.id && a.estado === "aprobada" && a.desde <= hoy && a.hasta >= hoy);
            const worked = t.fichajeInicio ? now - t.fichajeInicio - t.pausaAcumMin * 60e3 - (t.pausaInicio ? now - t.pausaInicio : 0) : 0;
            const flash = lastChange?.ids.includes(t.id) && Date.now() - lastChange.ts < 2500;
            return (
              <Card key={flash ? `${t.id}-${lastChange?.ts}` : t.id} className={cn("p-4", flash && "row-flash")}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={t.nombre} color={t.color} size={38} />
                    <span className={cn("absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface", t.estado === "trabajando" ? "bg-ok" : t.estado === "pausa" ? "bg-warn" : "bg-fg-3/40")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{t.nombre}</div>
                    <div className="text-xs text-fg-3">{t.rol}</div>
                  </div>
                  {vac ? <Badge tone="info">Vacaciones</Badge> : t.estado === "trabajando" ? <Badge tone="ok" dot>Trabajando</Badge> : t.estado === "pausa" ? <Badge tone="warn" dot>En pausa</Badge> : <Badge>Sin fichar</Badge>}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] text-fg-3">Hoy</div>
                    <div className={cn("font-display text-2xl font-semibold tabular", !t.fichajeInicio && "text-fg-3")}>{t.fichajeInicio ? fmt.clock(worked) : "00:00:00"}</div>
                  </div>
                  <div className="text-right text-xs text-fg-3">
                    {t.fichajeInicio ? (
                      <>
                        <div>Entrada {fmt.time(t.fichajeInicio)}</div>
                        <div className="flex items-center justify-end gap-1">
                          <MapPin className="size-3" /> {nearestTown(t.lat, t.lon)}
                        </div>
                      </>
                    ) : vac ? (
                      "Vuelve pronto"
                    ) : (
                      "Aún no ha empezado"
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Card className="overflow-hidden">
          <CardHeader title="Registro de jornada" sub="Entradas, salidas y pausas con ubicación. Exportable para inspección en un clic." />
          <DataTable
            rows={rows}
            rowKey={(e) => e.id}
            search={(e) => maps.tech[e.techId]?.nombre ?? ""}
            placeholder="Buscar trabajador"
            dense
            columns={[
              { key: "t", header: "Trabajador", cell: (e) => <span className="flex items-center gap-2"><Avatar name={maps.tech[e.techId]?.nombre ?? ""} color={maps.tech[e.techId]?.color} size={20} />{maps.tech[e.techId]?.nombre}</span>, sort: (e) => maps.tech[e.techId]?.nombre ?? "" },
              { key: "f", header: "Fecha", cell: (e) => <span className="tabular">{fmt.date(e.fecha)}</span>, sort: (e) => e.fecha },
              { key: "e", header: "Entrada", cell: (e) => <span className="tabular">{e.entrada}</span> },
              { key: "s", header: "Salida", cell: (e) => <span className="tabular">{e.salida}</span> },
              { key: "p", header: "Pausas", cell: (e) => <span className="tabular">{e.pausaMin} min</span>, hideSm: true },
              { key: "h", header: "Horas", cell: (e) => <span className="tabular font-medium">{fmt.num((toMin(e.salida) - toMin(e.entrada) - e.pausaMin) / 60, 2)}</span>, align: "right" },
              { key: "u", header: "Ubicación", cell: (e) => <span className="flex items-center gap-1 text-fg-2"><MapPin className="size-3" />{nearestTown(e.lat, e.lon)}</span>, hideSm: true },
            ]}
          />
        </Card>
      </div>
      <Modal open={tablet} onClose={() => { setTablet(false); setPin(""); setTabletOk(null); }} label="Tablet de fichaje" className="max-w-sm">
        <div className="grid gap-4 bg-[#0c1a22] p-6 text-white">
          <div className="text-center">
            <div className="font-display text-4xl font-semibold tabular">{fmt.time(now)}</div>
            <div className="text-sm text-white/60 capitalize">{fmt.dayLong(now)}</div>
          </div>
          <AnimatePresence mode="wait">
            {tabletOk ? (
              <motion.div key="ok" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid place-items-center gap-2 py-8">
                <span className="grid size-14 place-items-center rounded-full bg-ok">
                  <Check className="size-7" />
                </span>
                <div className="text-lg font-semibold">Hola, {tabletOk}</div>
                <div className="text-sm text-white/60">Entrada registrada a las {fmt.time(now)}</div>
              </motion.div>
            ) : (
              <motion.div key="pad" className="grid gap-3">
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn("size-3 rounded-full", i < pin.length ? "bg-sun" : "bg-white/20")} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k) => (
                    <button
                      key={k || "x"}
                      disabled={!k}
                      onClick={() => {
                        if (k === "⌫") return setPin((p) => p.slice(0, -1));
                        const next = (pin + k).slice(0, 4);
                        setPin(next);
                        if (next.length === 4) {
                          const t = techs.find((x) => x.estado === "fuera" && x.id !== "t6") ?? techs[1];
                          setTimeout(() => {
                            clockIn(t.id);
                            setTabletOk(t.nombre.split(" ")[0]);
                          }, 250);
                        }
                      }}
                      className="h-14 rounded-xl bg-white/10 text-xl font-medium transition hover:bg-white/15 active:scale-95 disabled:opacity-0"
                      aria-label={k === "⌫" ? "Borrar" : k}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div className="text-center text-xs text-white/50">Introduce tu código de 4 cifras</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Turnos ---------------- */
export function Turnos() {
  const techs = useDemo((s) => s.techs);
  const absences = useDemo((s) => s.absences);
  const monday = useMemo(() => {
    const d = startOfDay(new Date());
    return addDays(d, -((d.getDay() + 6) % 7));
  }, []);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const turno = (tid: string, d: Date) => {
    const iso = isoDay(d);
    if (absences.some((a) => a.techId === tid && a.estado === "aprobada" && a.desde <= iso && a.hasta >= iso)) return "vac";
    const h = hashString(tid + iso) % 10;
    if (d.getDay() === 0) return h < 2 ? "guardia" : "libre";
    if (d.getDay() === 6) return h < 3 ? "mañana" : h < 4 ? "guardia" : "libre";
    return h < 6 ? "mañana" : h < 9 ? "partido" : "tarde";
  };
  const T: Record<string, { label: string; cls: string; h: string }> = {
    mañana: { label: "Mañana", cls: "bg-info-soft text-info", h: "7:00 a 15:00" },
    partido: { label: "Partido", cls: "bg-brand-soft text-brand", h: "8:00 a 13:00, 15:00 a 18:00" },
    tarde: { label: "Tarde", cls: "bg-ai-soft text-ai", h: "12:00 a 20:00" },
    guardia: { label: "Guardia", cls: "bg-sun-soft text-sun", h: "Disponible 24 h" },
    libre: { label: "Libre", cls: "bg-surface-2 text-fg-3", h: "" },
    vac: { label: "Vacaciones", cls: "bg-ok-soft text-ok", h: "" },
  };
  return (
    <div className="pb-8">
      <PageHeader id="turnos" />
      <div className="px-4 sm:px-6">
        <Card className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-xs text-fg-3">
                <th className="h-10 px-4 font-medium">Semana del {fmt.date(monday)}</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className={cn("px-2 font-medium capitalize", isoDay(d) === isoDay(new Date()) && "text-brand")}>
                    {fmt.dayName(d).slice(0, 3)} {d.getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {techs.map((t) => (
                <tr key={t.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2">
                      <Avatar name={t.nombre} color={t.color} size={24} />
                      {t.nombre}
                    </span>
                  </td>
                  {days.map((d) => {
                    const k = turno(t.id, d);
                    return (
                      <td key={d.toISOString()} className="px-1.5 py-2">
                        <div className={cn("rounded-md px-2 py-1.5 text-xs font-medium", T[k].cls)} title={T[k].h}>
                          {T[k].label}
                          {T[k].h && <div className="truncate text-[10px] font-normal opacity-80">{T[k].h}</div>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-3 text-xs text-fg-3">Cada trabajador ve su cuadrante en la app y recibe un aviso cuando cambia.</p>
      </div>
    </div>
  );
}

/* ---------------- Vacaciones ---------------- */
export function Vacaciones() {
  const absences = useDemo((s) => s.absences);
  const techs = useDemo((s) => s.techs);
  const resolve = useDemo((s) => s.resolveAbsence);
  const lastChange = useDemo((s) => s.lastChange);
  const maps = useMaps();
  const start = startOfDay(new Date());
  const days = Array.from({ length: 35 }, (_, i) => addDays(start, i - 3));
  const pend = absences.filter((a) => a.estado === "pendiente");
  const dias = (a: (typeof absences)[number]) => Math.round((new Date(a.hasta).getTime() - new Date(a.desde).getTime()) / 864e5) + 1;

  return (
    <div className="pb-8">
      <PageHeader id="vacaciones" />
      <div className="grid gap-4 px-4 sm:px-6">
        <Card className="overflow-hidden" data-tour="vacaciones-pendientes">
          <CardHeader title="Solicitudes por aprobar" sub={pend.length ? `${pend.length} pendientes` : "No hay solicitudes pendientes"} />
          <div className="divide-y divide-line/70">
            <AnimatePresence initial={false}>
              {pend.map((a) => (
                <motion.div key={a.id} layout initial={{ opacity: 0, backgroundColor: "var(--sun-soft)" }} animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.8 }} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Avatar name={maps.tech[a.techId].nombre} color={maps.tech[a.techId].color} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{maps.tech[a.techId].nombre}</div>
                    <div className="text-xs text-fg-2">
                      <span className="capitalize">{a.tipo}</span> del {fmt.date(a.desde)} al {fmt.date(a.hasta)}, {dias(a)} días. Pedida {fmt.ago(a.solicitada)} desde la app.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => resolve(a.id, false)}>
                      <X className="size-3.5" /> Rechazar
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => resolve(a.id, true)} data-tour="aprobar-vacaciones">
                      <Check className="size-3.5" /> Aprobar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
        <Card className="overflow-x-auto scroll-thin">
          <CardHeader title="Calendario del equipo" sub="Próximas cinco semanas. Solo se muestra el tipo de ausencia, nunca el motivo médico." />
          <div className="min-w-[900px] px-4 pb-4">
            <div className="grid" style={{ gridTemplateColumns: `150px repeat(${days.length}, minmax(0,1fr))` }}>
              <div />
              {days.map((d) => (
                <div key={d.toISOString()} className={cn("pb-1 text-center text-[10px] text-fg-3", (d.getDay() === 0 || d.getDay() === 6) && "text-fg-3/60", isoDay(d) === isoDay(new Date()) && "font-bold text-brand")}>
                  {d.getDate()}
                </div>
              ))}
              {techs.map((t) => (
                <div key={t.id} className="contents">
                  <div className="flex items-center gap-2 py-1.5 text-[13px]">
                    <Avatar name={t.nombre} color={t.color} size={20} />
                    <span className="truncate">{t.nombre}</span>
                  </div>
                  {days.map((d) => {
                    const iso = isoDay(d);
                    const a = absences.find((x) => x.techId === t.id && x.estado !== "rechazada" && x.desde <= iso && x.hasta >= iso);
                    const flash = a && lastChange?.ids.includes(a.id) && Date.now() - lastChange.ts < 2500;
                    return (
                      <div key={iso} className={cn("my-1.5 h-6 border-y border-line/40", (d.getDay() === 0 || d.getDay() === 6) && "bg-surface-2/60")}>
                        {a && (
                          <div
                            className={cn("h-full", a.estado === "pendiente" ? "bg-[repeating-linear-gradient(135deg,var(--sun)_0_4px,transparent_4px_8px)] opacity-70" : a.tipo === "vacaciones" ? "bg-ok/80" : "bg-info/70", a.desde === iso && "ml-0.5 rounded-l-md", a.hasta === iso && "mr-0.5 rounded-r-md", flash && "animate-pulse")}
                            title={`${a.tipo} ${a.estado}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-fg-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded bg-ok/80" /> Vacaciones</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded bg-info/70" /> Otras ausencias</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded bg-[repeating-linear-gradient(135deg,var(--sun)_0_3px,transparent_3px_6px)]" /> Pendiente</span>
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Saldo de vacaciones" sub="23 días laborables al año" />
          <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
            {techs.map((t) => {
              const used = absences.filter((a) => a.techId === t.id && a.tipo === "vacaciones" && a.estado === "aprobada").reduce((s, a) => s + dias(a), 0) + (hashString(t.id) % 9) + 4;
              return (
                <div key={t.id} className="rounded-lg bg-surface-2 p-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">{t.nombre}</span>
                    <span className="tabular text-fg-2">{Math.max(0, 23 - used)} restantes</span>
                  </div>
                  <Progress value={(used / 23) * 100} className="mt-2" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Horas extra ---------------- */
export function HorasExtra() {
  const entries = useDemo((s) => s.timeEntries);
  const techs = useDemo((s) => s.techs);
  const [sent, setSent] = useState(false);
  const data = techs.map((t) => {
    const mine = entries.filter((e) => e.techId === t.id);
    const extra = mine.reduce((s, e) => s + Math.max(0, toMin(e.salida) - toMin(e.entrada) - e.pausaMin - 480), 0);
    const dias = mine.filter((e) => toMin(e.salida) - toMin(e.entrada) - e.pausaMin - 480 > 15).length;
    return { t, extra, dias, total: mine.reduce((s, e) => s + (toMin(e.salida) - toMin(e.entrada) - e.pausaMin), 0) };
  });
  return (
    <div className="pb-8">
      <PageHeader
        id="horas-extra"
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              downloadText(`horas-extra-${isoDay(new Date())}.csv`, toCsv([["Trabajador", "Horas trabajadas", "Horas extra", "Días con horas extra"], ...data.map((d) => [d.t.nombre, Math.round((d.total / 60) * 100) / 100, Math.round((d.extra / 60) * 100) / 100, d.dias])]), "text/csv;charset=utf-8");
              setSent(true);
            }}
          >
            <Send className="size-3.5" /> {sent ? "Enviado a la gestoría" : "Enviar a la gestoría"}
          </Button>
        }
      />
      <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
        {data.map((d) => (
          <Card key={d.t.id} className="p-4">
            <div className="flex items-center gap-2.5">
              <Avatar name={d.t.nombre} color={d.t.color} size={30} />
              <div className="text-[13px] font-semibold">{d.t.nombre}</div>
            </div>
            <div className="mt-3 flex items-end gap-4">
              <div>
                <div className="font-display text-3xl font-semibold tabular">
                  <AnimatedNumber value={d.extra / 60} format={(n) => fmt.num(n, 1)} />
                  <span className="text-sm font-normal text-fg-3"> h</span>
                </div>
                <div className="text-[11px] text-fg-3">extra en 30 días</div>
              </div>
              <div className="text-xs text-fg-2">
                {d.dias} días por encima de la jornada
                <br />
                {fmt.num(d.total / 60, 0)} h trabajadas
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-3 px-4 text-xs text-fg-3 sm:px-6">Calculadas a partir de los fichajes. La gestoría decide cómo se compensan.</p>
    </div>
  );
}

/* ---------------- Nóminas ---------------- */
export function Nominas() {
  const payslips = useDemo((s) => s.payslips);
  const techs = useDemo((s) => s.techs);
  const upload = useDemo((s) => s.uploadPayslips);
  const lastChange = useDemo((s) => s.lastChange);
  const [modal, setModal] = useState<0 | 1 | 2>(0);
  const months = [...new Set(payslips.map((p) => p.mes))].sort().reverse();

  return (
    <div className="pb-8">
      <PageHeader
        id="nominas"
        actions={
          <Button size="sm" variant="primary" onClick={() => setModal(1)}>
            <Upload className="size-3.5" /> Subir nóminas de la gestoría
          </Button>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6">
        <Card className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-xs text-fg-3">
                <th className="h-10 px-4 font-medium">Trabajador</th>
                {months.map((m) => (
                  <th key={m} className="px-3 font-medium capitalize">
                    {fmt.monthName(`${m}-15`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {techs.map((t) => (
                <tr key={t.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <Avatar name={t.nombre} color={t.color} size={24} />
                      {t.nombre}
                    </span>
                  </td>
                  {months.map((m) => {
                    const p = payslips.find((x) => x.techId === t.id && x.mes === m);
                    const flash = p && lastChange?.ids.includes(p.id) && Date.now() - lastChange.ts < 2500;
                    return (
                      <td key={m} className={cn("px-3 py-2.5", flash && "row-flash")}>
                        {p ? (
                          p.leida ? (
                            <span className="flex items-center gap-1 text-xs text-ok">
                              <CheckCheck className="size-3.5" /> Leída {fmt.dateShort(p.leida)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-fg-3">
                              <Eye className="size-3.5" /> Entregada, sin abrir
                            </span>
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Documentos del equipo" sub="Contratos, certificados y justificantes, cada uno visible solo para su trabajador" />
          <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
            {techs.flatMap((t, i) =>
              [
                ["Contrato de trabajo", "Firmado"],
                ["Certificado de retenciones", "Entregado"],
              ].map(([n, e], k) => (
                <div key={`${t.id}${k}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                  <FileText className="size-4 text-bad" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]">{n}</div>
                    <div className="text-[11px] text-fg-3">{t.nombre}</div>
                  </div>
                  <Badge tone={i % 3 === 0 && k ? "neutral" : "ok"}>{i % 3 === 0 && k ? "Sin abrir" : e}</Badge>
                </div>
              )),
            ).slice(0, 9)}
          </div>
        </Card>
        <p className="text-xs text-fg-3">Las nóminas las hace tu gestoría. La plataforma las reparte: cada persona recibe solo la suya, con aviso en el móvil y confirmación de lectura.</p>
      </div>
      <Modal open={modal > 0} onClose={() => setModal(0)} label="Subir nóminas">
        <div className="grid gap-4 p-5">
          <div className="font-display text-lg font-semibold">Repartir nóminas del mes</div>
          {modal === 1 ? (
            <button
              onClick={() => {
                setModal(2);
                setTimeout(() => {
                  upload();
                }, 1600);
              }}
              className="grid place-items-center gap-2 rounded-xl border-2 border-dashed border-line-strong px-6 py-10 text-center hover:border-brand hover:bg-brand-soft/40"
            >
              <Upload className="size-6 text-fg-3" />
              <div className="text-sm font-medium">Suelta aquí el PDF de la gestoría</div>
              <div className="text-xs text-fg-3">O pulsa para usar el de ejemplo: nominas-gestoria.pdf, {techs.length} páginas</div>
            </button>
          ) : (
            <div className="grid gap-2">
              {techs.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.22 }} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2 text-[13px]">
                  <FileText className="size-4 text-bad" />
                  <span className="flex-1">Página {i + 1}: detectada nómina de {t.nombre}</span>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.22 + 0.15 }}>
                    <Check className="size-4 text-ok" />
                  </motion.span>
                </motion.div>
              ))}
              <Button variant="primary" className="mt-2" onClick={() => setModal(0)}>
                Hecho, todos avisados en el móvil
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Prevención ---------------- */
export function Prevencion() {
  const techs = useDemo((s) => s.techs);
  const hoy = new Date();
  const cursos = ["Prevención de riesgos, 60 h", "Trabajos en altura", "Manipulación de productos químicos", "Primeros auxilios"];
  const epis = ["Guantes de protección", "Gafas", "Calzado de seguridad", "Arnés"];
  const rows = techs.flatMap((t) =>
    cursos.map((c, i) => {
      const cad = addDays(hoy, (hashString(t.id + c) % 700) - 60);
      return { id: `${t.id}${i}`, t, c, cad };
    }),
  );
  return (
    <div className="pb-8">
      <PageHeader id="prevencion" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader title="Formación y certificados" sub="Con aviso automático antes de caducar" />
          <DataTable
            rows={rows}
            rowKey={(r) => r.id}
            dense
            filters={[
              { label: "Todos", fn: () => true },
              { label: "Caducados", fn: (r) => r.cad < hoy },
              { label: "Caducan en 90 días", fn: (r) => r.cad >= hoy && r.cad < addDays(hoy, 90) },
            ]}
            columns={[
              { key: "t", header: "Trabajador", cell: (r) => r.t.nombre, sort: (r) => r.t.nombre },
              { key: "c", header: "Curso", cell: (r) => r.c },
              { key: "d", header: "Caduca", cell: (r) => <span className="tabular">{fmt.date(r.cad)}</span>, sort: (r) => r.cad.getTime() },
              { key: "e", header: "Estado", cell: (r) => (r.cad < hoy ? <Badge tone="bad">Caducado</Badge> : r.cad < addDays(hoy, 90) ? <Badge tone="warn">Renovar pronto</Badge> : <Badge tone="ok">Vigente</Badge>) },
            ]}
          />
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Entregas de equipos de protección" sub="Firmadas por el trabajador en la app" />
          <div className="divide-y divide-line/70">
            {techs.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <HardHat className="size-4 text-sun" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">{epis[i % epis.length]}</div>
                  <div className="text-[11px] text-fg-3">
                    {t.nombre}, {fmt.date(addDays(hoy, -(hashString(t.id) % 40) - 2))}
                  </div>
                </div>
                <Badge tone="ok">
                  <Fingerprint className="size-3" /> Firmada
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Comunicados ---------------- */
export function Comunicados() {
  const comunicados = useDemo((s) => s.comunicados);
  const techs = useDemo((s) => s.techs);
  const send = useDemo((s) => s.sendComunicado);
  const maps = useMaps();
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  return (
    <div className="pb-8">
      <PageHeader id="comunicados" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <Megaphone className="size-4" /> Nuevo comunicado
          </div>
          <form
            className="mt-3 grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!titulo.trim()) return;
              send(titulo.trim(), texto.trim() || titulo.trim());
              setTitulo("");
              setTexto("");
            }}
          >
            <input className={inputCls} placeholder="Título, por ejemplo: Cierre por festivo" value={titulo} onChange={(e) => setTitulo(e.target.value)} aria-label="Título" />
            <textarea className={cn(inputCls, "h-28 py-2")} placeholder="Escribe el mensaje para todo el equipo" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Mensaje" />
            <Button variant="primary" type="submit" disabled={!titulo.trim()}>
              <Send className="size-4" /> Enviar a {techs.length} personas
            </Button>
          </form>
        </Card>
        <div className="grid content-start gap-3">
          <AnimatePresence initial={false}>
            {comunicados.map((c) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-semibold">{c.titulo}</div>
                      <div className="text-[11px] text-fg-3">{fmt.date(c.fecha)}</div>
                    </div>
                    <Badge tone={c.leidos.length === techs.length ? "ok" : "neutral"}>
                      {c.leidos.length} de {techs.length} lo han leído
                    </Badge>
                  </div>
                  <p className="mt-2 text-[13px] text-fg-2">{c.texto}</p>
                  <div className="mt-3 flex -space-x-1.5">
                    {techs.map((t) => (
                      <span key={t.id} className={cn(!c.leidos.includes(t.id) && "opacity-30 grayscale")} title={`${maps.tech[t.id].nombre}: ${c.leidos.includes(t.id) ? "leído" : "sin leer"}`}>
                        <Avatar name={t.nombre} color={t.color} size={24} ring />
                      </span>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Chat ---------------- */
export function Chat() {
  const techs = useDemo((s) => s.techs);
  const chats = useDemo((s) => s.chats);
  const send = useDemo((s) => s.sendChat);
  const [sel, setSel] = useState(techs[0]?.id);
  const [msg, setMsg] = useState("");
  const thread = chats.filter((c) => c.techId === sel);
  const t = techs.find((x) => x.id === sel);
  return (
    <div className="flex h-full flex-col pb-6">
      <PageHeader id="chat" />
      <div className="mx-4 grid min-h-[480px] flex-1 overflow-hidden rounded-xl border border-line bg-surface sm:mx-6 md:grid-cols-[260px_1fr]">
        <div className="border-line max-md:border-b md:border-r">
          {techs.map((x) => {
            const last = [...chats].reverse().find((c) => c.techId === x.id);
            return (
              <button key={x.id} onClick={() => setSel(x.id)} className={cn("flex w-full items-center gap-3 border-b border-line/60 px-3 py-2.5 text-left", sel === x.id ? "bg-brand-soft/60" : "hover:bg-surface-2")}>
                <Avatar name={x.nombre} color={x.color} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{x.nombre}</div>
                  <div className="truncate text-xs text-fg-3">{last?.texto ?? "Sin mensajes"}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="border-b border-line px-4 py-2.5 text-[13px] font-semibold">{t?.nombre}</div>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto bg-surface-2/50 p-4 scroll-thin">
            {thread.length === 0 && <div className="m-auto text-sm text-fg-3">Empieza la conversación</div>}
            {thread.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("max-w-[75%] rounded-2xl px-3 py-2 text-[13px]", m.from === "oficina" ? "ml-auto rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md bg-surface shadow-e1")}>
                {m.texto}
                <div className={cn("mt-0.5 text-right text-[10px]", m.from === "oficina" ? "opacity-70" : "text-fg-3")}>{fmt.time(m.ts)}</div>
              </motion.div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!msg.trim() || !sel) return;
              send(sel, "oficina", msg.trim());
              setMsg("");
            }}
          >
            <input value={msg} onChange={(e) => setMsg(e.target.value)} className={inputCls} placeholder={`Mensaje para ${t?.nombre.split(" ")[0]}`} aria-label="Mensaje" />
            <Button variant="primary" type="submit" aria-label="Enviar">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
