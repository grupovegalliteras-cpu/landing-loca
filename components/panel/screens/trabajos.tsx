"use client";

import { Check, Clock, Download, FileText, MapPin, MessageCircle, Package, Receipt, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { useMaps, useNow } from "@/lib/hooks";
import { cn, fmt, isoDay } from "@/lib/utils";
import { Avatar, Badge, Button, Card, DataTable, Drawer, JobStatusBadge, JOB_STATUS, UrgencyBadge, inputCls, type Column } from "@/components/ui";
import { FakePhoto, Signature } from "@/components/photo";
import type { Job, JobStatus } from "@/data/types";
import { reportPdf } from "@/lib/pdf";
import { PageHeader } from "../shell";
import { usePanelNav } from "../nav";

export function Trabajos() {
  const jobs = useDemo((s) => s.jobs);
  const lastChange = useDemo((s) => s.lastChange);
  const focus = useUi((s) => s.panelFocus);
  const maps = useMaps();
  const [open, setOpen] = useState<string | undefined>(focus);
  useEffect(() => {
    if (focus && jobs.some((j) => j.id === focus)) setOpen(focus);
  }, [focus, jobs]);
  const hoy = isoDay(new Date());

  const rows = useMemo(() => [...jobs].filter((j) => j.fecha >= isoDay(new Date(Date.now() - 21 * 864e5))).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)), [jobs]);

  const columns: Column<Job>[] = [
    { key: "codigo", header: "Orden", cell: (j) => <span className="font-medium tabular">{j.codigo}</span>, sort: (j) => j.codigo },
    {
      key: "cliente",
      header: "Cliente",
      cell: (j) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{maps.client[j.clientId]?.nombre}</div>
          <div className="truncate text-xs text-fg-3">{j.titulo}</div>
        </div>
      ),
      sort: (j) => maps.client[j.clientId]?.nombre ?? "",
    },
    {
      key: "tecnico",
      header: "Técnico",
      cell: (j) =>
        j.techId ? (
          <span className="flex items-center gap-2">
            <Avatar name={maps.tech[j.techId].nombre} color={maps.tech[j.techId].color} size={22} />
            <span className="truncate">{maps.tech[j.techId].nombre}</span>
          </span>
        ) : (
          <span className="text-fg-3">Sin asignar</span>
        ),
      sort: (j) => (j.techId ? maps.tech[j.techId].nombre : "zzz"),
      hideSm: true,
    },
    { key: "fecha", header: "Fecha", cell: (j) => <span className="tabular">{j.fecha === hoy ? "Hoy" : fmt.date(j.fecha)}, {j.hora}</span>, sort: (j) => j.fecha + j.hora },
    { key: "prio", header: "Prioridad", cell: (j) => <UrgencyBadge u={j.prioridad} />, sort: (j) => ({ alta: 3, media: 2, baja: 1 })[j.prioridad], hideSm: true },
    { key: "estado", header: "Estado", cell: (j) => <JobStatusBadge s={j.estado} />, sort: (j) => j.estado },
    { key: "importe", header: "Importe", cell: (j) => <span className="tabular">{fmt.eur0(j.importe)}</span>, sort: (j) => j.importe, align: "right" },
  ];

  return (
    <div className="pb-8">
      <PageHeader id="trabajos" />
      <div className="px-4 sm:px-6">
        <Card className="overflow-hidden">
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(j) => j.id}
            search={(j) => `${j.codigo} ${maps.client[j.clientId]?.nombre} ${j.titulo} ${j.techId ? maps.tech[j.techId].nombre : ""}`}
            placeholder="Buscar orden, cliente o técnico"
            filters={[
              { label: "Hoy", fn: (j) => j.fecha === hoy },
              { label: "Sin asignar", fn: (j) => j.estado === "pendiente" },
              { label: "En curso", fn: (j) => j.estado === "en-curso" || j.estado === "en-camino" },
              { label: "Por facturar", fn: (j) => j.estado === "finalizado" },
              { label: "Próximos", fn: (j) => j.fecha > hoy },
              { label: "Todas", fn: () => true },
            ]}
            onRowClick={(j) => setOpen(j.id)}
            flashIds={lastChange?.ids}
            flashTs={lastChange?.ts}
            pageSize={14}
          />
        </Card>
      </div>
      <JobDrawer jobId={open} onClose={() => setOpen(undefined)} />
    </div>
  );
}

const TIMELINE: JobStatus[] = ["pendiente", "asignado", "en-camino", "en-curso", "finalizado", "facturado"];

export function JobDrawer({ jobId, onClose }: { jobId?: string; onClose: () => void }) {
  const job = useDemo((s) => s.jobs.find((j) => j.id === jobId));
  const techs = useDemo((s) => s.techs);
  const stock = useDemo((s) => s.stock);
  const chats = useDemo((s) => s.chats);
  const invoices = useDemo((s) => s.invoices);
  const assign = useDemo((s) => s.assignJob);
  const sendChat = useDemo((s) => s.sendChat);
  const sector = useSector();
  const maps = useMaps();
  const { go } = usePanelNav();
  const now = useNow(1000);
  const [msg, setMsg] = useState("");
  if (!job) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const c = maps.client[job.clientId];
  const t = job.techId ? maps.tech[job.techId] : undefined;
  const inst = job.installationId ? maps.inst[job.installationId] : undefined;
  const inv = invoices.find((i) => i.id === job.facturaId);
  const thread = chats.filter((m) => m.jobId === job.id);
  const idx = TIMELINE.indexOf(job.estado);
  const done = job.estado === "finalizado" || job.estado === "facturado";

  return (
    <Drawer open={!!jobId} onClose={onClose} title={<span className="flex items-center gap-2">{job.codigo} <JobStatusBadge s={job.estado} /></span>} width={560}>
      <div className="grid gap-5 p-5">
        <div>
          <div className="font-display text-lg font-semibold">{job.titulo}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fg-2">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {c.nombre}, {c.municipio}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {fmt.date(job.fecha)} a las {job.hora}, {fmt.dur(job.duracionMin)}
            </span>
            <UrgencyBadge u={job.prioridad} />
          </div>
          {inst && (
            <div className="mt-2 text-xs text-fg-3">
              {sector.instalacion.tipo}: <span className="text-fg-2">{inst.nombre}</span>, código {inst.codigo}
            </div>
          )}
        </div>

        {/* línea de estados */}
        <div className="flex items-center">
          {TIMELINE.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span className={cn("grid size-6 place-items-center rounded-full border-2 text-[10px] transition-colors", i <= idx ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-fg-3", i === idx && "ring-4 ring-brand/15")}>
                  {i < idx ? <Check className="size-3" /> : i + 1}
                </span>
                <span className={cn("text-[10px] whitespace-nowrap", i === idx ? "font-semibold text-fg" : "text-fg-3")}>{JOB_STATUS[s].label}</span>
              </div>
              {i < TIMELINE.length - 1 && <div className={cn("mx-1 mb-4 h-0.5 flex-1 rounded", i < idx ? "bg-brand" : "bg-line")} />}
            </div>
          ))}
        </div>

        <div className="grid gap-3 rounded-xl border border-line p-3.5 sm:grid-cols-2">
          <label className="grid gap-1 text-xs text-fg-2">
            Técnico asignado
            <select className={inputCls} value={job.techId ?? ""} onChange={(e) => assign(job.id, e.target.value || undefined)} disabled={done}>
              <option value="">Sin asignar</option>
              {techs.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-1 text-xs text-fg-2">
            Contacto en el sitio
            <div className="flex h-9 items-center text-sm text-fg">
              {c.contacto}, {c.telefono}
            </div>
          </div>
          {job.notasOficina && <div className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn sm:col-span-2">{job.notasOficina}</div>}
          {job.estado === "en-curso" && job.inicio && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand sm:col-span-2">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" />
                <span className="size-2 rounded-full bg-brand" />
              </span>
              {t?.nombre} lleva {fmt.clock(now - job.inicio)} trabajando aquí
            </div>
          )}
        </div>

        <section>
          <h4 className="mb-2 text-[13px] font-semibold">Checklist</h4>
          <div className="grid gap-1.5">
            {sector.checklist.map((item, i) => {
              const ok = done ? (job.checklistHecho?.[i] ?? true) : false;
              return (
                <div key={item} className="flex items-center gap-2.5 text-[13px]">
                  <span className={cn("grid size-4.5 place-items-center rounded border", ok ? "border-ok bg-ok text-white" : "border-line-strong")}>{ok && <Check className="size-3" />}</span>
                  <span className={cn(!ok && "text-fg-2")}>{item}</span>
                </div>
              );
            })}
          </div>
        </section>

        {done && (
          <>
            <section>
              <h4 className="mb-2 text-[13px] font-semibold">Mediciones</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sector.mediciones.map((m) => {
                  const v = job.mediciones?.[m.nombre] ?? (m.ok[0] + m.ok[1]) / 2;
                  const ok = v >= m.ok[0] && v <= m.ok[1];
                  return (
                    <div key={m.nombre} className="rounded-lg bg-surface-2 px-3 py-2">
                      <div className="text-[11px] text-fg-3">{m.nombre}</div>
                      <div className="tabular text-[15px] font-semibold">
                        {fmt.num(v, m.dec)} <span className="text-xs font-normal text-fg-3">{m.unidad}</span>
                      </div>
                      <div className={cn("text-[11px]", ok ? "text-ok" : "text-bad")}>{ok ? "Correcto" : "Fuera de rango"}</div>
                    </div>
                  );
                })}
              </div>
            </section>
            <section>
              <h4 className="mb-2 text-[13px] font-semibold">Fotos</h4>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: Math.min(3, job.fotos ?? 2) }).map((_, i) => (
                  <FakePhoto key={i} seed={`${job.id}${i}`} after={i > 0} label={i === 0 ? "Antes" : "Después"} stamp={`${fmt.dateShort(job.fecha)} ${job.hora}`} tint={sector.color} className="aspect-[4/3]" />
                ))}
              </div>
            </section>
            {!!job.material?.filter((m) => m.cantidad > 0).length && (
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                  <Package className="size-3.5" /> Material descontado de la furgoneta
                </h4>
                <div className="grid gap-1 text-[13px]">
                  {job.material!.filter((m) => m.cantidad > 0).map((m) => {
                    const it = stock.find((s) => s.id === m.itemId);
                    return (
                      <div key={m.itemId} className="flex justify-between">
                        <span>{it?.nombre}</span>
                        <span className="tabular text-fg-2">
                          {m.cantidad} {it?.unidad}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            <section className="flex items-end justify-between rounded-xl border border-line p-3">
              <div>
                <div className="text-[11px] text-fg-3">Firmado por</div>
                <div className="text-[13px] font-medium">{job.firmadoPor}</div>
              </div>
              <Signature name={job.firmadoPor ?? c.contacto} />
            </section>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => reportPdf(job, c, t, inst, sector, stock)}>
                <Download className="size-4" /> Informe en PDF
              </Button>
              {inv && (
                <Button variant="primary" onClick={() => go("facturacion", inv.id)}>
                  <Receipt className="size-4" /> {inv.estado === "borrador" ? "Revisar factura" : `Ver ${inv.numero}`}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-xs text-ok">
              <FileText className="size-3.5" /> Informe enviado a {c.email} al cerrar el parte.
            </div>
          </>
        )}

        {t && (
          <section>
            <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
              <MessageCircle className="size-3.5" /> Chat con {t.nombre.split(" ")[0]}
            </h4>
            <div className="grid gap-1.5 rounded-xl bg-surface-2 p-3">
              {thread.length === 0 && <div className="text-center text-xs text-fg-3">Sin mensajes en este trabajo</div>}
              {thread.map((m) => (
                <div key={m.id} className={cn("max-w-[80%] rounded-xl px-3 py-1.5 text-[13px]", m.from === "oficina" ? "ml-auto bg-brand text-brand-ink" : "bg-surface")}>
                  {m.texto}
                  <div className={cn("text-right text-[10px]", m.from === "oficina" ? "opacity-70" : "text-fg-3")}>{fmt.time(m.ts)}</div>
                </div>
              ))}
              <form
                className="mt-1 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!msg.trim()) return;
                  sendChat(t.id, "oficina", msg.trim(), job.id);
                  setMsg("");
                }}
              >
                <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escribe al técnico" className={cn(inputCls, "bg-surface")} aria-label="Mensaje" />
                <Button variant="primary" type="submit" aria-label="Enviar">
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </section>
        )}
        {!done && <Badge tone="neutral" className="justify-self-start">Importe previsto {fmt.eur(job.importe)} + IVA</Badge>}
      </div>
    </Drawer>
  );
}
