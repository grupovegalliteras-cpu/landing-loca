"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  BadgeCheck, Banknote, Camera, Check, Copy, CreditCard, Download, FileMinus, Landmark, Link2, Mail, MessageCircle, Repeat, ScanLine, Send, ShieldCheck, Smartphone, Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { useMaps } from "@/lib/hooks";
import { addDays, cn, fmt, isoDay } from "@/lib/utils";
import { AnimatedNumber, Badge, Button, Card, CardHeader, DataTable, Drawer, InvoiceStatusBadge, Modal, Segmented, type Column } from "@/components/ui";
import { AreaChart, BarChart, Donut, HBars } from "@/components/charts";
import { FakePhoto } from "@/components/photo";
import type { Invoice } from "@/data/types";
import { invoicePdf } from "@/lib/pdf";
import { downloadText, toCsv } from "@/lib/download";
import { PageHeader } from "../shell";

/* ---------------- QR ---------------- */
export function QrSvg({ text, className }: { text: string; className?: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    import("qrcode").then((Q) => Q.default.toString(text, { type: "svg", margin: 0, color: { dark: "#0c1a22", light: "#ffffff" } })).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [text]);
  return <div className={cn("bg-white p-1.5 [&>svg]:size-full", className)} dangerouslySetInnerHTML={{ __html: svg }} aria-label="Código QR" role="img" />;
}

/* ---------------- Facturación ---------------- */
export function Facturacion() {
  const invoices = useDemo((s) => s.invoices);
  const lastChange = useDemo((s) => s.lastChange);
  const focus = useUi((s) => s.panelFocus);
  const maps = useMaps();
  const [open, setOpen] = useState<string | undefined>(() => (focus && invoices.some((i) => i.id === focus) ? focus : undefined));
  useEffect(() => {
    if (focus && invoices.some((i) => i.id === focus)) setOpen(focus);
  }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps
  const mes = isoDay(new Date()).slice(0, 7);
  const emit = invoices.filter((i) => i.estado !== "borrador");
  const rows = useMemo(() => [...invoices].sort((a, b) => (a.estado === "borrador" ? -1 : 0) - (b.estado === "borrador" ? -1 : 0) || b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero)), [invoices]);

  const cols: Column<Invoice>[] = [
    { key: "numero", header: "Número", cell: (i) => <span className={cn("font-medium tabular", i.estado === "borrador" && "text-fg-3 italic")}>{i.numero}</span>, sort: (i) => i.numero },
    { key: "cliente", header: "Cliente", cell: (i) => <span className="font-medium">{maps.client[i.clientId]?.nombre}</span>, sort: (i) => maps.client[i.clientId]?.nombre ?? "" },
    { key: "fecha", header: "Fecha", cell: (i) => <span className="tabular">{fmt.date(i.fecha)}</span>, sort: (i) => i.fecha, hideSm: true },
    { key: "origen", header: "Origen", cell: (i) => <span className="text-fg-2">{i.contratoId ? "Cuota de contrato" : i.serie === "R" ? "Rectificativa" : "Parte de trabajo"}</span>, hideSm: true },
    { key: "vf", header: "VeriFactu", cell: (i) => (i.verifactu ? <span className="flex items-center gap-1 text-xs text-ok"><ShieldCheck className="size-3.5" /> Registrada</span> : <span className="text-xs text-fg-3">Pendiente</span>), hideSm: true },
    { key: "estado", header: "Estado", cell: (i) => <InvoiceStatusBadge s={i.estado} />, sort: (i) => i.estado },
    { key: "total", header: "Total", cell: (i) => <span className="tabular font-medium">{fmt.eur(i.total)}</span>, sort: (i) => i.total, align: "right" },
  ];

  return (
    <div className="pb-8">
      <PageHeader id="facturacion" />
      <div className="grid gap-4 px-4 sm:px-6">
        <Card className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-line">
          <KpiMini label="Emitido este mes" value={<AnimatedNumber value={emit.filter((i) => i.fecha.startsWith(mes)).reduce((s, i) => s + i.total, 0)} format={fmt.eur0} />} />
          <KpiMini label="Pendiente de cobro" value={<AnimatedNumber value={emit.filter((i) => i.estado === "emitida" || i.estado === "vencida").reduce((s, i) => s + i.total, 0)} format={fmt.eur0} />} />
          <KpiMini label="Borradores listos" value={<AnimatedNumber value={invoices.filter((i) => i.estado === "borrador").length} />} sub="Salen solos al cerrar el parte" />
          <KpiMini label="Registradas con VeriFactu" value={<AnimatedNumber value={invoices.filter((i) => i.verifactu).length} />} sub="Con QR en cada factura" />
        </Card>
        <Card className="overflow-hidden">
          <DataTable
            rows={rows}
            columns={cols}
            rowKey={(i) => i.id}
            search={(i) => `${i.numero} ${maps.client[i.clientId]?.nombre}`}
            placeholder="Buscar factura o cliente"
            filters={[
              { label: "Todas", fn: () => true },
              { label: "Borradores", fn: (i) => i.estado === "borrador" },
              { label: "Pendientes", fn: (i) => i.estado === "emitida" },
              { label: "Vencidas", fn: (i) => i.estado === "vencida" },
              { label: "Cobradas", fn: (i) => i.estado === "cobrada" },
            ]}
            onRowClick={(i) => setOpen(i.id)}
            flashIds={lastChange?.ids}
            flashTs={lastChange?.ts}
          />
        </Card>
      </div>
      <InvoiceDrawer id={open} onClose={() => setOpen(undefined)} />
    </div>
  );
}

function KpiMini({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="px-4 py-3.5">
      <div className="text-xs text-fg-3">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-fg-3">{sub}</div>}
    </div>
  );
}

export function InvoiceDrawer({ id, onClose }: { id?: string; onClose: () => void }) {
  const inv = useDemo((s) => s.invoices.find((i) => i.id === id));
  const issue = useDemo((s) => s.issueInvoice);
  const pay = useDemo((s) => s.payInvoice);
  const remind = useDemo((s) => s.sendReminder);
  const rectify = useDemo((s) => s.rectify);
  const sector = useSector();
  const maps = useMaps();
  const [sent, setSent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmR, setConfirmR] = useState(false);
  if (!inv) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const c = maps.client[inv.clientId];

  return (
    <Drawer open={!!id} onClose={onClose} title={<span className="flex items-center gap-2">{inv.numero} <InvoiceStatusBadge s={inv.estado} /></span>} width={600}>
      <div className="grid gap-4 p-5">
        {/* documento */}
        <motion.div layout className="rounded-xl border border-line bg-white p-5 text-[#0c1a22] shadow-e1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg font-display font-bold text-white" style={{ background: sector.color }}>
                {sector.empresaCorta[0]}
              </span>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold">{sector.empresa}</div>
                <div className="text-[10px] text-[#7a8893]">Son Castelló, Palma</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-semibold">{inv.serie === "R" ? "Rectificativa" : "Factura"}</div>
              <div className="text-[11px] text-[#7a8893]">{inv.numero}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-[11px]">
            <div className="col-span-1">
              <div className="text-[#7a8893]">Cliente</div>
              <div className="font-medium">{c.nombre}</div>
              <div className="text-[#465661]">{c.cif}</div>
            </div>
            <div>
              <div className="text-[#7a8893]">Fecha</div>
              <div className="tabular">{fmt.date(inv.fecha)}</div>
            </div>
            <div>
              <div className="text-[#7a8893]">Vence</div>
              <div className="tabular">{fmt.date(inv.vencimiento)}</div>
            </div>
          </div>
          <table className="mt-4 w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#dde3e7] text-left text-[10.5px] text-[#7a8893]">
                <th className="py-1.5 font-medium">Concepto</th>
                <th className="py-1.5 text-right font-medium">Cant.</th>
                <th className="py-1.5 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {inv.lineas.map((l, i) => (
                <tr key={i} className="border-b border-[#eef2f4]">
                  <td className="py-1.5 pr-2">{l.concepto}</td>
                  <td className="tabular py-1.5 text-right">{l.cantidad}</td>
                  <td className="tabular py-1.5 text-right">{fmt.eur(l.cantidad * l.precio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 ml-auto grid w-48 gap-1 text-[12px]">
            <div className="flex justify-between text-[#465661]">
              <span>Base</span>
              <span className="tabular">{fmt.eur(inv.base)}</span>
            </div>
            <div className="flex justify-between text-[#465661]">
              <span>IVA 21 %</span>
              <span className="tabular">{fmt.eur(inv.iva)}</span>
            </div>
            <div className="flex justify-between border-t border-[#0c1a22] pt-1 text-[14px] font-semibold">
              <span>Total</span>
              <span className="tabular">{fmt.eur(inv.total)}</span>
            </div>
          </div>
          <AnimatePresence>
            {inv.verifactu && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex items-center gap-3 overflow-hidden rounded-lg bg-[#f4f6f7] p-2.5">
                <QrSvg text={`https://nexo4pymes.com/demo?factura=${inv.numero}`} className="size-16 shrink-0 rounded" />
                <div className="min-w-0 text-[11px] leading-snug">
                  <div className="flex items-center gap-1 font-semibold text-[#13845a]">
                    <BadgeCheck className="size-3.5" /> Factura registrada con VeriFactu
                  </div>
                  <div className="truncate text-[#465661]">Huella {inv.verifactu.huella}</div>
                  <div className="text-[#7a8893]">
                    {fmt.date(inv.verifactu.registrada)} a las {fmt.time(inv.verifactu.registrada)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {inv.estado === "borrador" ? (
          <div className="grid gap-2">
            <Button variant="primary" size="lg" onClick={() => issue(inv.id)} data-tour="emitir-factura">
              <ShieldCheck className="size-4" /> Emitir y registrar con VeriFactu
            </Button>
            <p className="text-center text-xs text-fg-3">Se numera, se registra y se genera el enlace de pago en un clic.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {inv.enlacePago && inv.estado !== "cobrada" && (
              <div className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2 text-[13px] font-semibold">
                  <Link2 className="size-4 text-brand" /> Enlace de pago
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md bg-surface-2 px-2 py-1.5 text-xs">{inv.enlacePago}</code>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(inv.enlacePago!).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button variant="secondary" onClick={() => setSent("whatsapp")}>
                    <MessageCircle className="size-4 text-ok" /> Enviar por WhatsApp
                  </Button>
                  <Button variant="secondary" onClick={() => setSent("email")}>
                    <Mail className="size-4" /> Enviar por email
                  </Button>
                </div>
                <AnimatePresence>
                  {sent && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-xs text-ok">
                      <Check className="size-3.5" /> Enviada por {sent === "whatsapp" ? `WhatsApp al ${c.telefono}` : `email a ${c.email}`}, con el PDF y el enlace de pago.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {(inv.estado === "emitida" || inv.estado === "vencida") && inv.serie !== "R" && (
              <div className="rounded-xl border border-dashed border-line-strong p-3" data-tour="pagar-factura">
                <div className="text-xs text-fg-3">Simular lo que hace el cliente</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => pay(inv.id, "bizum")}>
                    <Smartphone className="size-4" /> Paga con Bizum
                  </Button>
                  <Button variant="secondary" onClick={() => pay(inv.id, "tarjeta")}>
                    <CreditCard className="size-4" /> Paga con tarjeta
                  </Button>
                </div>
                {inv.estado === "vencida" && (
                  <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => remind(inv.id)}>
                    <Send className="size-3.5" /> Enviar recordatorio ({inv.recordatorios} enviados)
                  </Button>
                )}
              </div>
            )}
            {inv.estado === "cobrada" && (
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-3 rounded-xl bg-ok-soft p-3 text-ok">
                <span className="grid size-9 place-items-center rounded-full bg-ok text-white">
                  <Check className="size-5" />
                </span>
                <div className="text-[13px]">
                  <div className="font-semibold">Cobrada</div>
                  <div className="text-xs opacity-90">
                    {inv.metodo ? `Por ${inv.metodo}` : ""} {inv.cobradaEn ? `el ${fmt.date(inv.cobradaEn)} a las ${fmt.time(inv.cobradaEn)}` : ""}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => invoicePdf(inv, c, sector)}>
            <Download className="size-4" /> Descargar PDF
          </Button>
          <Button variant="ghost" onClick={() => setConfirmR(true)} disabled={inv.estado === "borrador" || inv.serie === "R"}>
            <FileMinus className="size-4" /> Rectificativa
          </Button>
        </div>
      </div>
      <Modal open={confirmR} onClose={() => setConfirmR(false)} label="Crear rectificativa">
        <div className="grid gap-3 p-5">
          <div className="font-display text-lg font-semibold">Crear factura rectificativa</div>
          <p className="text-sm text-fg-2">
            Se creará una rectificativa en la serie R que anula {inv.numero} por {fmt.eur(inv.total)} y se registrará con VeriFactu.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmR(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                rectify(inv.id);
                setConfirmR(false);
              }}
            >
              Crear rectificativa
            </Button>
          </div>
        </div>
      </Modal>
    </Drawer>
  );
}

/* ---------------- Recurrente ---------------- */
export function Recurrente() {
  const contracts = useDemo((s) => s.contracts);
  const invoices = useDemo((s) => s.invoices);
  const maps = useMaps();
  const [done, setDone] = useState(false);
  const activos = contracts.filter((c) => c.estado !== "pendiente-firma");
  const mensual = activos.reduce((s, c) => s + (c.periodicidad === "mensual" ? c.cuota : c.periodicidad === "trimestral" ? c.cuota / 3 : c.cuota / 12), 0);
  return (
    <div className="pb-8">
      <PageHeader
        id="recurrente"
        actions={
          <Button variant="primary" size="sm" onClick={() => setDone(true)} disabled={done}>
            <Repeat className="size-3.5" /> {done ? "Cuotas del mes generadas" : "Generar cuotas del mes"}
          </Button>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6">
        <Card className="grid grid-cols-3 divide-x divide-line">
          <KpiMini label="Ingreso recurrente al mes" value={<AnimatedNumber value={mensual} format={fmt.eur0} />} sub="Sin IVA" />
          <KpiMini label="Contratos que facturan solos" value={activos.length} />
          <KpiMini label="Cuotas emitidas (90 días)" value={invoices.filter((i) => i.contratoId).length} />
        </Card>
        <Card className="overflow-hidden">
          <DataTable
            rows={activos}
            rowKey={(c) => c.id}
            columns={[
              { key: "c", header: "Cliente", cell: (c) => <span className="font-medium">{maps.client[c.clientId]?.nombre}</span>, sort: (c) => maps.client[c.clientId]?.nombre ?? "" },
              { key: "p", header: "Periodicidad", cell: (c) => <span className="capitalize">{c.periodicidad}</span> },
              { key: "q", header: "Cuota", cell: (c) => <span className="tabular">{fmt.eur(c.cuota)}</span>, sort: (c) => c.cuota, align: "right" },
              { key: "n", header: "Próxima emisión", cell: () => <span className="tabular">{fmt.date(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))}</span> },
              { key: "m", header: "Cobro", cell: () => <Badge tone="info">Remesa SEPA</Badge> },
              { key: "e", header: "Estado", cell: (c) => <Badge tone={c.estado === "activo" ? "ok" : "warn"}>{c.estado === "activo" ? "Activo" : "Por renovar"}</Badge> },
            ]}
          />
        </Card>
        {done && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-[13px] text-ok">
            <Check className="size-4" /> {activos.filter((c) => c.periodicidad === "mensual").length} cuotas mensuales generadas, registradas y añadidas a la próxima remesa.
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Cobros ---------------- */
export function Cobros() {
  const invoices = useDemo((s) => s.invoices);
  const contracts = useDemo((s) => s.contracts);
  const lastChange = useDemo((s) => s.lastChange);
  const maps = useMaps();
  const [open, setOpen] = useState<string>();
  const [remesa, setRemesa] = useState(false);
  const desde = isoDay(addDays(new Date(), -30));
  const cobradas = invoices.filter((i) => i.cobradaEn && isoDay(new Date(i.cobradaEn)) >= desde);
  const metodos = (["tarjeta", "bizum", "transferencia", "remesa SEPA"] as const).map((m, i) => ({
    label: m,
    value: cobradas.filter((x) => x.metodo === m).reduce((s, x) => s + x.total, 0),
    color: ["var(--brand)", "var(--ok)", "var(--ai)", "var(--sun)"][i],
  }));
  const total = metodos.reduce((s, m) => s + m.value, 0);
  const pendientes = invoices.filter((i) => i.estado === "emitida" || i.estado === "vencida");
  const recibos = contracts.filter((c) => c.estado !== "pendiente-firma" && c.periodicidad === "mensual");

  return (
    <div className="pb-8">
      <PageHeader
        id="cobros"
        actions={
          <Button size="sm" variant="primary" onClick={() => setRemesa(true)}>
            <Landmark className="size-3.5" /> Preparar remesa SEPA
          </Button>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="p-4">
          <div className="text-[13px] font-semibold">Cobrado en los últimos 30 días</div>
          <div className="mt-4 flex items-center gap-5">
            <Donut
              parts={metodos}
              center={
                <div>
                  <div className="font-display text-lg font-semibold">
                    <AnimatedNumber value={total} format={fmt.eur0} />
                  </div>
                  <div className="text-[10px] text-fg-3">{cobradas.length} cobros</div>
                </div>
              }
            />
            <div className="grid flex-1 gap-2">
              {metodos.map((m) => (
                <div key={m.label} className="flex items-center gap-2 text-[13px]">
                  <span className="size-2.5 rounded-sm" style={{ background: m.color }} />
                  <span className="flex-1 capitalize">{m.label}</span>
                  <span className="tabular text-fg-2">{fmt.eur0(m.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-surface-2 p-3 text-xs text-fg-2">
            Cada factura sale con su enlace de pago. El cliente paga con tarjeta o Bizum desde el móvil y aquí se marca como cobrada sola.
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Pendiente de cobro" sub={`${pendientes.length} facturas, ${fmt.eur0(pendientes.reduce((s, i) => s + i.total, 0))}`} />
          <DataTable
            rows={pendientes}
            rowKey={(i) => i.id}
            onRowClick={(i) => setOpen(i.id)}
            flashIds={lastChange?.ids}
            flashTs={lastChange?.ts}
            pageSize={8}
            defaultSort={{ key: "v", dir: 1 }}
            columns={[
              { key: "n", header: "Factura", cell: (i) => <span className="font-medium tabular">{i.numero}</span> },
              { key: "c", header: "Cliente", cell: (i) => maps.client[i.clientId]?.nombre },
              { key: "v", header: "Vence", cell: (i) => <span className="tabular">{fmt.date(i.vencimiento)}</span>, sort: (i) => i.vencimiento },
              { key: "e", header: "Estado", cell: (i) => <InvoiceStatusBadge s={i.estado} /> },
              { key: "t", header: "Total", cell: (i) => <span className="tabular">{fmt.eur(i.total)}</span>, align: "right", sort: (i) => i.total },
            ]}
          />
        </Card>
      </div>
      <InvoiceDrawer id={open} onClose={() => setOpen(undefined)} />
      <Modal open={remesa} onClose={() => setRemesa(false)} label="Remesa SEPA" className="max-w-xl">
        <div className="grid gap-4 p-5">
          <div>
            <div className="font-display text-lg font-semibold">Remesa de recibos domiciliados</div>
            <p className="text-sm text-fg-2">Cuotas de contratos con cargo el día 5. Se genera el fichero para subir a tu banco.</p>
          </div>
          <div className="max-h-64 divide-y divide-line overflow-auto rounded-lg border border-line scroll-thin">
            {recibos.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                <span>{maps.client[c.clientId]?.nombre}</span>
                <span className="tabular">{fmt.eur(c.cuota * 1.21)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg-2">{recibos.length} recibos</span>
            <span className="font-semibold tabular">{fmt.eur(recibos.reduce((s, c) => s + c.cuota * 1.21, 0))}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRemesa(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const lines = recibos.map((c) => `  <Recibo cliente="${maps.client[c.clientId]?.nombre}" importe="${(c.cuota * 1.21).toFixed(2)}" concepto="${c.nombre}"/>`);
                downloadText(`remesa-${isoDay(new Date())}.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Fichero de ejemplo de la demo de Nexo4Pymes -->\n<Remesa fecha="${isoDay(new Date())}">\n${lines.join("\n")}\n</Remesa>\n`, "application/xml");
                setRemesa(false);
              }}
            >
              <Download className="size-4" /> Generar fichero
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Impagos ---------------- */
export function Impagos() {
  const invoices = useDemo((s) => s.invoices);
  const remind = useDemo((s) => s.sendReminder);
  const lastChange = useDemo((s) => s.lastChange);
  const maps = useMaps();
  const [open, setOpen] = useState<string>();
  const now = Date.now();
  const vencidas = invoices.filter((i) => i.estado === "vencida" || (i.estado === "emitida" && new Date(i.vencimiento).getTime() < now));
  const dias = (i: Invoice) => Math.max(0, Math.floor((now - new Date(i.vencimiento).getTime()) / 864e5));
  const buckets = [
    { label: "0 a 15 días", fn: (d: number) => d <= 15 },
    { label: "16 a 30", fn: (d: number) => d > 15 && d <= 30 },
    { label: "31 a 60", fn: (d: number) => d > 30 && d <= 60 },
    { label: "Más de 60", fn: (d: number) => d > 60 },
  ].map((b, i) => ({ label: b.label, value: vencidas.filter((x) => b.fn(dias(x))).reduce((s, x) => s + x.total, 0), c: ["var(--warn)", "var(--sun)", "var(--bad)", "#8f1f19"][i] }));

  return (
    <div className="pb-8">
      <PageHeader id="impagos" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card className="p-4">
          <div className="text-[13px] font-semibold">Antigüedad de la deuda</div>
          <div className="mt-1 text-xs text-fg-3">{fmt.eur0(vencidas.reduce((s, i) => s + i.total, 0))} vencidos en {vencidas.length} facturas</div>
          <div className="mt-4">
            <BarChart data={buckets} format={fmt.eur0} colors={buckets.map((b) => b.c)} />
          </div>
          <div className="mt-5 grid gap-2">
            <div className="text-xs font-medium text-fg-2">Recordatorios automáticos</div>
            <div className="flex items-center gap-2">
              {[7, 15, 30].map((d, i) => (
                <div key={d} className="flex flex-1 items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">{d}</span>
                  <span className="text-[11px] text-fg-3">{["Aviso amable", "Segundo aviso", "Aviso final"][i]}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-fg-3">Por WhatsApp y email, con el enlace de pago. Se paran solos cuando el cliente paga.</div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <DataTable
            rows={vencidas}
            rowKey={(i) => i.id}
            onRowClick={(i) => setOpen(i.id)}
            flashIds={lastChange?.ids}
            flashTs={lastChange?.ts}
            defaultSort={{ key: "d", dir: -1 }}
            columns={[
              { key: "c", header: "Cliente", cell: (i) => <div><div className="font-medium">{maps.client[i.clientId]?.nombre}</div><div className="text-xs text-fg-3">{i.numero}</div></div> },
              { key: "d", header: "Días vencida", cell: (i) => <span className={cn("tabular font-medium", dias(i) > 30 ? "text-bad" : "text-warn")}>{dias(i)}</span>, sort: (i) => dias(i) },
              {
                key: "r",
                header: "Recordatorios",
                cell: (i) => (
                  <span className="flex gap-1">
                    {[0, 1, 2].map((k) => (
                      <span key={k} className={cn("size-2 rounded-full", k < i.recordatorios ? "bg-brand" : "bg-line-strong")} />
                    ))}
                  </span>
                ),
              },
              { key: "t", header: "Importe", cell: (i) => <span className="tabular">{fmt.eur(i.total)}</span>, align: "right", sort: (i) => i.total },
              {
                key: "a",
                header: "",
                cell: (i) => (
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      remind(i.id);
                    }}
                  >
                    <Send className="size-3" /> Recordar
                  </Button>
                ),
                align: "right",
              },
            ]}
          />
        </Card>
      </div>
      <InvoiceDrawer id={open} onClose={() => setOpen(undefined)} />
    </div>
  );
}

/* ---------------- Gastos ---------------- */
export function Gastos() {
  const expenses = useDemo((s) => s.expenses);
  const techs = useDemo((s) => s.techs);
  const addExpense = useDemo((s) => s.addExpense);
  const maps = useMaps();
  const [scan, setScan] = useState<0 | 1 | 2>(0);
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach((e) => m.set(e.categoria, (m.get(e.categoria) ?? 0) + e.base));
    const colors = ["var(--brand)", "var(--sun)", "var(--ai)", "var(--ok)", "var(--info)", "var(--bad)"];
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
  }, [expenses]);

  const startScan = () => {
    setScan(1);
    setTimeout(() => setScan(2), 1900);
  };

  return (
    <div className="pb-8">
      <PageHeader
        id="gastos"
        actions={
          <Button size="sm" variant="primary" onClick={startScan}>
            <Camera className="size-3.5" /> Subir foto de ticket
          </Button>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]">
        <Card className="p-4">
          <div className="text-[13px] font-semibold">Gasto por categoría</div>
          <div className="text-xs text-fg-3">Últimos 90 días, sin IVA</div>
          <div className="mt-4 flex justify-center">
            <Donut parts={cats} size={150} center={<div className="font-display text-base font-semibold">{fmt.eur0(cats.reduce((s, c) => s + c.value, 0))}</div>} />
          </div>
          <div className="mt-4 grid gap-1.5">
            {cats.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-[13px]">
                <span className="size-2.5 rounded-sm" style={{ background: c.color }} />
                <span className="flex-1">{c.label}</span>
                <span className="tabular text-fg-2">{fmt.eur0(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <DataTable
            rows={expenses}
            rowKey={(e) => e.id}
            search={(e) => `${e.proveedor} ${e.categoria}`}
            placeholder="Buscar proveedor"
            filters={[{ label: "Todos", fn: () => true }, ...["Material", "Combustible", "Vehículo", "Dietas"].map((c) => ({ label: c, fn: (e: (typeof expenses)[number]) => e.categoria === c }))]}
            columns={[
              { key: "f", header: "", cell: (e) => <FakePhoto seed={e.id} className="h-8 w-7" />, className: "w-10" },
              { key: "p", header: "Proveedor", cell: (e) => <div><div className="font-medium">{e.proveedor}</div><div className="text-xs text-fg-3">{fmt.date(e.fecha)}</div></div>, sort: (e) => e.fecha },
              { key: "c", header: "Categoría", cell: (e) => <Badge>{e.categoria}</Badge> },
              { key: "t", header: "Técnico", cell: (e) => (e.techId ? maps.tech[e.techId]?.nombre : <span className="text-fg-3">Oficina</span>), hideSm: true },
              { key: "l", header: "Lectura", cell: () => <span className="flex items-center gap-1 text-xs text-ai"><Sparkles className="size-3" /> Automática</span>, hideSm: true },
              { key: "b", header: "Total", cell: (e) => <span className="tabular">{fmt.eur(e.base + e.iva)}</span>, align: "right", sort: (e) => e.base + e.iva },
            ]}
          />
        </Card>
      </div>
      <Modal open={scan > 0} onClose={() => setScan(0)} label="Leer ticket">
        <div className="grid gap-4 p-5 sm:grid-cols-[160px_1fr]">
          <div className="relative overflow-hidden rounded-lg border border-line bg-white p-3 font-mono text-[9px] leading-tight text-[#333]">
            <div className="text-center font-bold">SUMINISTROS FERRER PALMA</div>
            <div className="text-center">C/ Gremi Forners 12</div>
            <div className="mt-2">Fecha {fmt.date(new Date())}</div>
            <div className="mt-2 flex justify-between"><span>Latiguillos x4</span><span>25,60</span></div>
            <div className="flex justify-between"><span>Válvula 1/2</span><span>19,60</span></div>
            <div className="flex justify-between"><span>Teflón x6</span><span>6,60</span></div>
            <div className="mt-2 flex justify-between border-t border-dashed pt-1"><span>Base</span><span>51,80</span></div>
            <div className="flex justify-between"><span>IVA 21%</span><span>10,88</span></div>
            <div className="flex justify-between font-bold"><span>TOTAL</span><span>62,68</span></div>
            {scan === 1 && <motion.div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-ai/40 to-transparent" initial={{ top: "-10%" }} animate={{ top: "100%" }} transition={{ duration: 0.9, repeat: Infinity }} />}
          </div>
          <div className="grid content-start gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ScanLine className="size-4 text-ai" /> {scan === 1 ? "Leyendo el ticket…" : "Ticket leído"}
            </div>
            {scan === 2 ? (
              <motion.div initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.07 } } }} className="grid gap-2">
                {[
                  ["Proveedor", "Suministros Ferrer Palma"],
                  ["Fecha", fmt.date(new Date())],
                  ["Categoría", "Material"],
                  ["Base", "51,80 €"],
                  ["IVA", "10,88 €"],
                ].map(([k, v]) => (
                  <motion.div key={k} variants={{ h: { opacity: 0, x: -6 }, s: { opacity: 1, x: 0 } }} className="flex justify-between rounded-md bg-surface-2 px-2.5 py-1.5 text-[13px]">
                    <span className="text-fg-3">{k}</span>
                    <span className="font-medium">{v}</span>
                  </motion.div>
                ))}
                <Button
                  variant="primary"
                  onClick={() => {
                    addExpense(techs[0].id, "Suministros Ferrer Palma", "Material", 51.8);
                    setScan(0);
                  }}
                >
                  <Check className="size-4" /> Guardar gasto
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton h-8" />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Contabilidad ---------------- */
export function Contabilidad() {
  const invoices = useDemo((s) => s.invoices);
  const expenses = useDemo((s) => s.expenses);
  const maps = useMaps();
  const [exported, setExported] = useState(false);
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const qStart = isoDay(new Date(now.getFullYear(), q * 3, 1));
  const emit = invoices.filter((i) => i.estado !== "borrador");
  const months = [2, 1, 0].map((k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const key = isoDay(d).slice(0, 7);
    return {
      key,
      label: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(d),
      ing: emit.filter((i) => i.fecha.startsWith(key)).reduce((s, i) => s + i.base, 0),
      gas: expenses.filter((e) => e.fecha.startsWith(key)).reduce((s, e) => s + e.base, 0) + 9800,
    };
  });
  const ivaRep = emit.filter((i) => i.fecha >= qStart).reduce((s, i) => s + i.iva, 0);
  const ivaSop = expenses.filter((e) => e.fecha >= qStart).reduce((s, e) => s + e.iva, 0) + 1450;
  const movimientos = invoices
    .filter((i) => i.cobradaEn)
    .sort((a, b) => (b.cobradaEn ?? 0) - (a.cobradaEn ?? 0))
    .slice(0, 8);
  const pendiente = emit.filter((i) => i.estado !== "cobrada");
  const prev = Array.from({ length: 9 }, (_, w) => {
    const d = addDays(now, w * 7);
    const entradas = pendiente.filter((i) => i.vencimiento <= isoDay(d)).reduce((s, i) => s + i.total, 0) * 0.85;
    return { x: isoDay(d), y: 38000 + entradas - w * 5200 + (w % 4 === 0 ? -6200 : 0) + w * 2900 };
  });

  return (
    <div className="pb-8">
      <PageHeader
        id="contabilidad"
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              const rows: (string | number)[][] = [["Tipo", "Número", "Fecha", "Cliente o proveedor", "Base", "IVA", "Total"]];
              emit.forEach((i) => rows.push(["Ingreso", i.numero, fmt.date(i.fecha), maps.client[i.clientId]?.nombre ?? "", i.base, i.iva, i.total]));
              expenses.forEach((e) => rows.push(["Gasto", e.id, fmt.date(e.fecha), e.proveedor, e.base, e.iva, e.base + e.iva]));
              downloadText(`libro-registro-${isoDay(now)}.csv`, toCsv(rows), "text/csv;charset=utf-8");
              setExported(true);
            }}
          >
            <Download className="size-3.5" /> {exported ? "Exportado para la gestoría" : "Exportar para la gestoría"}
          </Button>
        }
      />
      <div className="grid gap-4 px-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <div className="text-[13px] font-semibold">Ingresos y gastos</div>
            <div className="text-xs text-fg-3">Últimos tres meses, sin IVA. Los gastos incluyen nóminas y cuotas estimadas.</div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {months.map((m) => (
                <div key={m.key}>
                  <div className="flex h-40 items-end gap-1.5">
                    <motion.div className="flex-1 rounded-t-md bg-brand" initial={{ height: 0 }} animate={{ height: `${(m.ing / Math.max(...months.map((x) => Math.max(x.ing, x.gas)))) * 100}%` }} transition={{ duration: 0.7 }} />
                    <motion.div className="flex-1 rounded-t-md bg-line-strong" initial={{ height: 0 }} animate={{ height: `${(m.gas / Math.max(...months.map((x) => Math.max(x.ing, x.gas)))) * 100}%` }} transition={{ duration: 0.7, delay: 0.1 }} />
                  </div>
                  <div className="mt-2 text-center text-xs capitalize text-fg-2">{m.label}</div>
                  <div className={cn("text-center text-xs font-medium tabular", m.ing - m.gas >= 0 ? "text-ok" : "text-bad")}>{fmt.eur0(m.ing - m.gas)}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-[13px] font-semibold">IVA estimado del trimestre</div>
            <div className="text-xs text-fg-3">Orientativo, lo confirma tu gestoría</div>
            <div className="mt-4 grid gap-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-fg-2">IVA repercutido</span>
                <span className="tabular">{fmt.eur0(ivaRep)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-2">IVA soportado</span>
                <span className="tabular">-{fmt.eur0(ivaSop)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <span>A ingresar</span>
                <span className="font-display text-xl tabular">{fmt.eur0(ivaRep - ivaSop)}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-info-soft p-2.5 text-xs text-info">Tu gestoría recibe el libro de ingresos y gastos ya ordenado. Nosotros no sustituimos a tu gestoría: le ahorramos trabajo.</div>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Conciliación bancaria" sub="Cobros del banco casados con sus facturas" />
            <div className="divide-y divide-line/70">
              {movimientos.map((i) => (
                <div key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Banknote className="size-4 text-fg-3" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]">{i.metodo === "remesa SEPA" ? "Recibo SEPA" : i.metodo === "bizum" ? "Bizum recibido" : i.metodo === "tarjeta" ? "Pago con tarjeta" : "Transferencia"} {maps.client[i.clientId]?.nombre}</div>
                    <div className="text-[11px] text-fg-3">{fmt.date(i.cobradaEn!)}</div>
                  </div>
                  <span className="tabular text-[13px] font-medium text-ok">+{fmt.eur(i.total)}</span>
                  <Badge tone="ok"><Check className="size-3" /> {i.numero}</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Previsión de tesorería" sub="Próximas 8 semanas, con cobros pendientes y pagos fijos" />
            <div className="px-3 pb-3">
              <AreaChart data={prev} format={(n) => `${fmt.num(n / 1000, 0)} mil`} xLabel={(s) => fmt.dateShort(s)} color="var(--ok)" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Rentabilidad ---------------- */
export function Rentabilidad() {
  const invoices = useDemo((s) => s.invoices);
  const jobs = useDemo((s) => s.jobs);
  const contracts = useDemo((s) => s.contracts);
  const sector = useSector();
  const maps = useMaps();
  const [dim, setDim] = useState<"cliente" | "servicio" | "tecnico" | "contrato">("cliente");

  const data = useMemo(() => {
    const done = jobs.filter((j) => j.estado === "facturado" || j.estado === "finalizado");
    const cost = (j: (typeof done)[number]) => (j.horasReales ?? j.duracionMin / 60) * 26 + j.importe * 0.12 + 9;
    const agg = new Map<string, { ing: number; cost: number; n: number }>();
    const add = (k: string, ing: number, c: number) => {
      const v = agg.get(k) ?? { ing: 0, cost: 0, n: 0 };
      agg.set(k, { ing: v.ing + ing, cost: v.cost + c, n: v.n + 1 });
    };
    if (dim === "contrato") {
      contracts.forEach((k) => {
        const ing = invoices.filter((i) => i.contratoId === k.id).reduce((s, i) => s + i.base, 0) || k.cuota;
        const cst = done.filter((j) => j.clientId === k.clientId).slice(0, 3).reduce((s, j) => s + cost(j), 0) + ing * 0.35;
        add(maps.client[k.clientId]?.nombre ?? k.id, ing, cst);
      });
    } else {
      done.forEach((j) => {
        const key = dim === "cliente" ? maps.client[j.clientId]?.nombre : dim === "servicio" ? sector.servicios[j.servicio]?.nombre : j.techId ? maps.tech[j.techId]?.nombre : "Sin técnico";
        add(key ?? "", j.importe, cost(j));
      });
    }
    return [...agg.entries()]
      .map(([label, v]) => ({ label, ing: v.ing, margen: v.ing - v.cost, pct: v.ing ? ((v.ing - v.cost) / v.ing) * 100 : 0, n: v.n }))
      .sort((a, b) => b.margen - a.margen);
  }, [jobs, invoices, contracts, dim, maps, sector]);

  return (
    <div className="pb-8">
      <PageHeader
        id="rentabilidad"
        actions={<Segmented value={dim} onChange={setDim} options={[{ value: "cliente", label: "Clientes" }, { value: "servicio", label: "Servicios" }, { value: "tecnico", label: "Técnicos" }, { value: "contrato", label: "Contratos" }]} />}
      />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="p-4">
          <div className="text-[13px] font-semibold">Margen por {dim === "tecnico" ? "técnico" : dim}</div>
          <div className="mb-4 text-xs text-fg-3">Ingresos menos horas, material y desplazamientos (últimos 90 días)</div>
          <HBars data={data.slice(0, 8).map((d) => ({ label: d.label, value: Math.max(0, d.margen), extra: `${fmt.num(d.pct, 0)} % de margen sobre ${fmt.eur0(d.ing)}`, color: d.pct < 25 ? "var(--warn)" : "var(--ok)" }))} format={fmt.eur0} />
        </Card>
        <Card className="overflow-hidden">
          <DataTable
            key={dim}
            rows={data}
            rowKey={(d) => d.label}
            defaultSort={{ key: "m", dir: -1 }}
            columns={[
              { key: "l", header: dim === "tecnico" ? "Técnico" : dim[0].toUpperCase() + dim.slice(1), cell: (d) => <span className="font-medium">{d.label}</span>, sort: (d) => d.label },
              { key: "n", header: dim === "contrato" ? "Cuotas" : "Trabajos", cell: (d) => <span className="tabular">{d.n}</span>, sort: (d) => d.n, align: "right" },
              { key: "i", header: "Ingresos", cell: (d) => <span className="tabular">{fmt.eur0(d.ing)}</span>, sort: (d) => d.ing, align: "right" },
              { key: "m", header: "Margen", cell: (d) => <span className="tabular font-medium">{fmt.eur0(d.margen)}</span>, sort: (d) => d.margen, align: "right" },
              { key: "p", header: "%", cell: (d) => <span className={cn("tabular", d.pct < 25 ? "text-warn" : "text-ok")}>{fmt.num(d.pct, 0)} %</span>, sort: (d) => d.pct, align: "right" },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
