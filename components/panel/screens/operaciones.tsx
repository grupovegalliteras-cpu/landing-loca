"use client";

import { motion } from "motion/react";
import { AlertTriangle, Check, Download, FileCheck2, Fuel, Mail, Package, ShoppingCart, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useDemo, useSector } from "@/store/demo";
import { useMaps } from "@/lib/hooks";
import { addDays, cn, fmt, isoDay } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, DataTable, Modal, Progress, Segmented } from "@/components/ui";
import { FakePhoto } from "@/components/photo";
import { reportPdf } from "@/lib/pdf";
import { downloadText, toCsv } from "@/lib/download";
import { PageHeader } from "../shell";
import { JobDrawer } from "./trabajos";

/* ---------------- Informes ---------------- */
export function Informes() {
  const jobs = useDemo((s) => s.jobs);
  const stock = useDemo((s) => s.stock);
  const lastChange = useDemo((s) => s.lastChange);
  const sector = useSector();
  const maps = useMaps();
  const [open, setOpen] = useState<string>();
  const rows = useMemo(() => jobs.filter((j) => j.informe).sort((a, b) => (b.fin ?? 0) - (a.fin ?? 0) || b.fecha.localeCompare(a.fecha)).slice(0, 200), [jobs]);
  return (
    <div className="pb-8">
      <PageHeader id="informes" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <DataTable
            rows={rows}
            rowKey={(j) => j.id}
            onRowClick={(j) => setOpen(j.id)}
            flashIds={lastChange?.ids}
            flashTs={lastChange?.ts}
            search={(j) => `${j.codigo} ${maps.client[j.clientId]?.nombre}`}
            placeholder="Buscar informe"
            columns={[
              { key: "c", header: "Informe", cell: (j) => <div><div className="font-medium">{j.codigo} {j.titulo}</div><div className="text-xs text-fg-3">{maps.client[j.clientId]?.nombre}</div></div> },
              { key: "f", header: "Fecha", cell: (j) => <span className="tabular">{fmt.date(j.fecha)}</span>, sort: (j) => j.fecha },
              { key: "e", header: "Envío", cell: () => <span className="flex items-center gap-1 text-xs text-ok"><Mail className="size-3.5" /> Enviado</span>, hideSm: true },
              {
                key: "d",
                header: "",
                align: "right",
                cell: (j) => (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      reportPdf(j, maps.client[j.clientId], j.techId ? maps.tech[j.techId] : undefined, j.installationId ? maps.inst[j.installationId] : undefined, sector, stock);
                    }}
                  >
                    <Download className="size-3" /> PDF
                  </Button>
                ),
              },
            ]}
          />
        </Card>
        <Card className="p-4">
          <div className="text-[13px] font-semibold">Así lo recibe tu cliente</div>
          <div className="mt-3 rounded-xl border border-line bg-white p-4 text-[#0c1a22] shadow-e1">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-md text-xs font-bold text-white" style={{ background: sector.color }}>{sector.empresaCorta[0]}</span>
              <span className="text-[13px] font-semibold">{sector.empresa}</span>
              <span className="ml-auto text-[10px] text-[#7a8893]">Informe de servicio</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <FakePhoto seed="demo-a" label="Antes" tint={sector.color} className="aspect-[4/3]" />
              <FakePhoto seed="demo-b" label="Después" after tint={sector.color} className="aspect-[4/3]" />
            </div>
            <div className="mt-3 grid gap-1 text-[11px]">
              {sector.mediciones.slice(0, 3).map((m) => (
                <div key={m.nombre} className="flex justify-between">
                  <span className="text-[#465661]">{m.nombre}</span>
                  <span className="font-medium">{fmt.num((m.ok[0] + m.ok[1]) / 2, m.dec)} {m.unidad} <span className="text-[#13845a]">Correcto</span></span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#13845a]">
              <FileCheck2 className="size-3.5" /> Firmado por el cliente en el móvil del técnico
            </div>
          </div>
          <p className="mt-3 text-xs text-fg-3">Con tu logo y tus colores. Sale solo al cerrar el parte, sin que nadie en la oficina tenga que hacer nada.</p>
        </Card>
      </div>
      <JobDrawer jobId={open} onClose={() => setOpen(undefined)} />
    </div>
  );
}

/* ---------------- Almacén ---------------- */
export function Almacen() {
  const stock = useDemo((s) => s.stock);
  const techs = useDemo((s) => s.techs);
  const lastChange = useDemo((s) => s.lastChange);
  const [vista, setVista] = useState<"nave" | "furgonetas">("nave");
  const [pedido, setPedido] = useState<0 | 1 | 2>(0);
  const bajos = stock.filter((s) => s.nave < s.minimo);
  const valor = stock.reduce((s, it) => s + it.precio * (it.nave + Object.values(it.furgonetas).reduce((a, b) => a + b, 0)), 0);
  return (
    <div className="pb-8">
      <PageHeader
        id="almacen"
        actions={
          <>
            <Segmented value={vista} onChange={setVista} options={[{ value: "nave", label: "Nave" }, { value: "furgonetas", label: "Furgonetas" }]} />
            <Button size="sm" variant="primary" onClick={() => setPedido(1)} disabled={!bajos.length}>
              <ShoppingCart className="size-3.5" /> Pedir lo que falta
            </Button>
          </>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <div className="text-xs text-fg-3">Valor del stock</div>
            <div className="mt-1 font-display text-2xl font-semibold tabular">{fmt.eur0(valor)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-fg-3">Por debajo del mínimo</div>
            <div className={cn("mt-1 font-display text-2xl font-semibold tabular", bajos.length && "text-warn")}>{bajos.length} artículos</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-fg-3">Descuento automático</div>
            <div className="mt-1 text-[13px] text-fg-2">Cada parte cerrado resta el material de la furgoneta del técnico y suma el coste al trabajo.</div>
          </Card>
        </div>
        {vista === "nave" ? (
          <Card className="overflow-hidden">
            <DataTable
              rows={stock}
              rowKey={(s) => s.id}
              flashIds={lastChange?.ids}
              flashTs={lastChange?.ts}
              search={(s) => `${s.nombre} ${s.ref}`}
              placeholder="Buscar material o referencia"
              columns={[
                { key: "n", header: "Material", cell: (s) => <div><div className="font-medium">{s.nombre}</div><div className="text-xs text-fg-3 tabular">{s.ref}</div></div>, sort: (s) => s.nombre },
                { key: "p", header: "Coste", cell: (s) => <span className="tabular">{fmt.eur(s.precio)}</span>, align: "right" },
                {
                  key: "q",
                  header: "En nave",
                  cell: (s) => (
                    <div className="w-32">
                      <div className="flex justify-between text-xs">
                        <span className={cn("tabular font-medium", s.nave < s.minimo && "text-warn")}>{s.nave} {s.unidad}</span>
                        <span className="text-fg-3">mín. {s.minimo}</span>
                      </div>
                      <Progress value={(s.nave / (s.minimo * 4)) * 100} tone={s.nave < s.minimo ? "warn" : "brand"} className="mt-1" />
                    </div>
                  ),
                  sort: (s) => s.nave / s.minimo,
                },
                { key: "f", header: "En furgonetas", cell: (s) => <span className="tabular">{Object.values(s.furgonetas).reduce((a, b) => a + b, 0)} {s.unidad}</span>, align: "right" },
                { key: "e", header: "", cell: (s) => (s.nave < s.minimo ? <Badge tone="warn"><AlertTriangle className="size-3" /> Pedir</Badge> : null) },
              ]}
            />
          </Card>
        ) : (
          <Card className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-fg-3">
                  <th className="h-10 px-4 font-medium">Material</th>
                  {techs.map((t) => (
                    <th key={t.id} className="px-2 text-center font-medium">
                      <span className="inline-flex flex-col items-center gap-1">
                        <Avatar name={t.nombre} color={t.color} size={22} />
                        {t.nombre.split(" ")[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.map((s) => (
                  <tr key={s.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-2">{s.nombre}</td>
                    {techs.map((t) => {
                      const q = s.furgonetas[t.id] ?? 0;
                      const flash = lastChange?.ids.includes(s.id) && Date.now() - lastChange.ts < 2500;
                      return (
                        <td key={t.id} className={cn("px-2 py-2 text-center tabular", q <= 1 && "text-bad", flash && "row-flash")}>
                          {q}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
      <Modal open={pedido > 0} onClose={() => setPedido(0)} label="Pedido a proveedor">
        <div className="grid gap-4 p-5">
          <div className="font-display text-lg font-semibold">Pedido a Suministros Ferrer Palma</div>
          {pedido === 1 ? (
            <>
              <div className="grid gap-1.5">
                {bajos.map((s) => (
                  <div key={s.id} className="flex justify-between rounded-lg bg-surface-2 px-3 py-2 text-[13px]">
                    <span>{s.nombre}</span>
                    <span className="tabular">
                      {s.minimo * 3 - s.nave} {s.unidad}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total estimado</span>
                <span className="tabular">{fmt.eur(bajos.reduce((a, s) => a + (s.minimo * 3 - s.nave) * s.precio, 0))}</span>
              </div>
              <Button variant="primary" onClick={() => setPedido(2)}>
                <Mail className="size-4" /> Enviar pedido por email
              </Button>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 rounded-lg bg-ok-soft p-3 text-[13px] text-ok">
              <Check className="size-5" /> Pedido enviado. Cuando llegue, se suma al stock de la nave con un clic.
            </motion.div>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Flota ---------------- */
export function Flota() {
  const vehicles = useDemo((s) => s.vehicles);
  const maps = useMaps();
  const lim = isoDay(addDays(new Date(), 30));
  const aviso = (d: string) => (d < isoDay(new Date()) ? <Badge tone="bad">Vencido</Badge> : d <= lim ? <Badge tone="warn">{fmt.date(d)}</Badge> : <span className="tabular">{fmt.date(d)}</span>);
  return (
    <div className="pb-8">
      <PageHeader
        id="flota"
        actions={
          <Button size="sm" variant="secondary" onClick={() => downloadText(`flota-${isoDay(new Date())}.csv`, toCsv([["Matrícula", "Modelo", "Técnico", "Km", "ITV", "Seguro", "Revisión"], ...vehicles.map((v) => [v.matricula, v.modelo, maps.tech[v.techId]?.nombre ?? "", v.km, fmt.date(v.itv), fmt.date(v.seguro), fmt.date(v.revision)])]), "text/csv;charset=utf-8")}>
            <Download className="size-3.5" /> Exportar
          </Button>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-surface-2">
                  <Truck className="size-5 text-fg-2" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">{v.modelo}</div>
                  <div className="font-mono text-xs text-fg-3">{v.matricula}</div>
                </div>
                <Avatar name={maps.tech[v.techId]?.nombre ?? ""} color={maps.tech[v.techId]?.color} size={26} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
                <span className="text-fg-3">Kilómetros</span>
                <span className="text-right tabular">{fmt.int(v.km)}</span>
                <span className="text-fg-3">ITV</span>
                <span className="text-right">{aviso(v.itv)}</span>
                <span className="text-fg-3">Seguro</span>
                <span className="text-right">{aviso(v.seguro)}</span>
                <span className="text-fg-3">Revisión</span>
                <span className="text-right">{aviso(v.revision)}</span>
                <span className="flex items-center gap-1 text-fg-3"><Fuel className="size-3" /> Combustible mes</span>
                <span className="text-right tabular">{fmt.eur0(v.combustibleMes)}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Incidencias ---------------- */
export function Incidencias() {
  const incidencias = useDemo((s) => s.incidencias);
  const maps = useMaps();
  const [estados, setEstados] = useState<Record<string, string>>({});
  const est = (id: string, def: string) => estados[id] ?? def;
  return (
    <div className="pb-8">
      <PageHeader id="incidencias" />
      <div className="px-4 sm:px-6">
        <Card className="overflow-hidden">
          <CardHeader title="Reclamaciones, garantías y retrabajos" sub="Cada una con su responsable y su seguimiento hasta el cierre" />
          <DataTable
            rows={incidencias}
            rowKey={(i) => i.id}
            filters={[
              { label: "Abiertas", fn: (i) => est(i.id, i.estado) !== "cerrada" },
              { label: "Todas", fn: () => true },
            ]}
            columns={[
              { key: "t", header: "Incidencia", cell: (i) => <div><div className="font-medium">{i.titulo}</div><div className="text-xs text-fg-3">{maps.client[i.clientId]?.nombre}</div></div> },
              { key: "k", header: "Tipo", cell: (i) => <Badge tone={i.tipo === "garantía" ? "info" : i.tipo === "reclamación" ? "bad" : "warn"}>{i.tipo}</Badge> },
              { key: "a", header: "Abierta", cell: (i) => <span className="tabular">{fmt.date(i.abierta)}</span>, sort: (i) => i.abierta, hideSm: true },
              {
                key: "e",
                header: "Estado",
                cell: (i) => (
                  <select
                    value={est(i.id, i.estado)}
                    onChange={(e) => setEstados((s) => ({ ...s, [i.id]: e.target.value }))}
                    className="h-7 rounded-md border border-line bg-bg px-1.5 text-xs"
                    aria-label="Estado"
                  >
                    <option value="abierta">Abierta</option>
                    <option value="en curso">En curso</option>
                    <option value="cerrada">Cerrada</option>
                  </select>
                ),
              },
            ]}
          />
        </Card>
        <div className="mt-3 flex items-center gap-2 text-xs text-fg-3">
          <Package className="size-3.5" /> Las incidencias también pueden abrirse desde la app del técnico o desde el portal del cliente.
        </div>
      </div>
    </div>
  );
}
