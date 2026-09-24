"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown, Banknote, Bell, CalendarDays, Check, FileSpreadsheet, Globe, Lock, Mail, MapPinned, Send, ServerCog, ShieldCheck, Sparkles, UserCog, X, Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDemo, useSector, type DemoState } from "@/store/demo";
import { useUi } from "@/store/ui";
import { addDays, cn, fmt, isoDay } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, Overlay } from "@/components/ui";
import { PageHeader } from "../shell";
import { usePanelNav } from "../nav";

/* ---------------- Motor de respuestas del asistente ---------------- */
type Answer = { text: string; link?: { label: string; go: string; focus?: string }; bars?: { label: string; value: number }[] };
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function answer(q: string, s: DemoState): Answer {
  const n = norm(q);
  const year = String(new Date().getFullYear());
  const client = s.clients.find((c) => n.includes(norm(c.nombre)) || norm(c.nombre).split(" ").filter((w) => w.length > 3 && !["hotel", "villa", "comunidad", "clinica"].includes(w)).some((w) => n.includes(w)));
  const emit = s.invoices.filter((i) => i.estado !== "borrador");

  if (client && /factur|gastado|cuanto/.test(n)) {
    const inv = emit.filter((i) => i.clientId === client.id && i.fecha.startsWith(year));
    const tot = inv.reduce((a, i) => a + i.total, 0);
    const pend = inv.filter((i) => i.estado !== "cobrada").reduce((a, i) => a + i.total, 0);
    return { text: `A ${client.nombre} le has facturado ${fmt.eur(tot)} este año en ${inv.length} facturas. ${pend ? `Tiene ${fmt.eur(pend)} pendientes de cobro.` : "Lo tiene todo pagado."}`, link: { label: `Abrir ficha de ${client.nombre}`, go: "clientes", focus: client.id } };
  }
  if (/hueco|libre|disponible|quien puede/.test(n)) {
    let d = new Date();
    const idx = DIAS.findIndex((x) => n.includes(norm(x)));
    if (n.includes("manana")) d = addDays(d, 1);
    else if (idx >= 0) {
      const diff = (idx - d.getDay() + 7) % 7 || 7;
      d = addDays(d, diff);
    }
    const iso = isoDay(d);
    const carga = s.techs
      .filter((t) => !s.absences.some((a) => a.techId === t.id && a.estado === "aprobada" && a.desde <= iso && a.hasta >= iso))
      .map((t) => ({ t, n: s.jobs.filter((j) => j.techId === t.id && j.fecha === iso).length }))
      .sort((a, b) => a.n - b.n);
    const best = carga[0];
    return {
      text: `El ${fmt.dayLong(d)} quien más hueco tiene es ${best.t.nombre}, con ${best.n} ${best.n === 1 ? "trabajo" : "trabajos"} en agenda. Después ${carga[1]?.t.nombre} (${carga[1]?.n}).`,
      bars: carga.map((c) => ({ label: c.t.nombre.split(" ")[0], value: c.n })),
      link: { label: "Ver planificación", go: "planificacion" },
    };
  }
  if (/venc|debe|impag|moroso|sin cobrar|pendiente de cobro/.test(n)) {
    const v = emit.filter((i) => i.estado === "vencida");
    const by = new Map<string, number>();
    v.forEach((i) => by.set(i.clientId, (by.get(i.clientId) ?? 0) + i.total));
    const top = [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    return {
      text: `Tienes ${v.length} facturas vencidas por ${fmt.eur(v.reduce((a, i) => a + i.total, 0))}. Los que más deben: ${top.map(([id, t]) => `${s.clients.find((c) => c.id === id)?.nombre} (${fmt.eur0(t)})`).join(", ")}.`,
      link: { label: "Ver impagos", go: "impagos" },
    };
  }
  if (/cobr/.test(n)) {
    const mes = isoDay(new Date()).slice(0, 7);
    const c = emit.filter((i) => i.cobradaEn && isoDay(new Date(i.cobradaEn)).startsWith(mes));
    return { text: `Este mes has cobrado ${fmt.eur(c.reduce((a, i) => a + i.total, 0))} de ${c.length} facturas.`, link: { label: "Ver cobros", go: "cobros" } };
  }
  if (/factur/.test(n)) {
    const mes = isoDay(new Date()).slice(0, 7);
    const f = emit.filter((i) => i.fecha.startsWith(mes));
    return { text: `Este mes llevas ${fmt.eur(f.reduce((a, i) => a + i.total, 0))} facturados en ${f.length} facturas, IVA incluido.`, link: { label: "Ver facturación", go: "facturacion" } };
  }
  if (/hoy|trabajos|ordenes/.test(n)) {
    const hoy = isoDay(new Date());
    const j = s.jobs.filter((x) => x.fecha === hoy);
    const done = j.filter((x) => x.estado === "finalizado" || x.estado === "facturado").length;
    return { text: `Hoy hay ${j.length} trabajos: ${done} terminados, ${j.filter((x) => x.estado === "en-curso").length} en curso y ${j.filter((x) => x.estado === "asignado").length} por empezar.`, link: { label: "Ver trabajos", go: "trabajos" } };
  }
  if (/stock|material|falta|almacen/.test(n)) {
    const b = s.stock.filter((x) => x.nave < x.minimo);
    return { text: b.length ? `Hay ${b.length} artículos por debajo del mínimo: ${b.map((x) => `${x.nombre} (${x.nave} ${x.unidad})`).join(", ")}.` : "Todo el material está por encima del mínimo.", link: { label: "Ver almacén", go: "almacen" } };
  }
  if (/vacacion|ausen|fiesta/.test(n)) {
    const hoy = isoDay(new Date());
    const now = s.absences.filter((a) => a.estado === "aprobada" && a.desde <= hoy && a.hasta >= hoy);
    const pend = s.absences.filter((a) => a.estado === "pendiente");
    return { text: `${now.length ? `Hoy está de vacaciones ${now.map((a) => s.techs.find((t) => t.id === a.techId)?.nombre).join(" y ")}.` : "Hoy no falta nadie."} ${pend.length ? `Tienes ${pend.length} solicitudes por aprobar.` : ""}`, link: { label: "Ver vacaciones", go: "vacaciones" } };
  }
  if (/mejor cliente|rentab|margen/.test(n)) {
    const by = new Map<string, number>();
    emit.filter((i) => i.fecha.startsWith(year)).forEach((i) => by.set(i.clientId, (by.get(i.clientId) ?? 0) + i.total));
    const top = [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { text: `Tus mejores clientes este año son ${top.slice(0, 3).map(([id]) => s.clients.find((c) => c.id === id)?.nombre).join(", ")}.`, bars: top.map(([id, v]) => ({ label: s.clients.find((c) => c.id === id)?.nombre.split(" ").slice(0, 2).join(" ") ?? "", value: Math.round(v) })), link: { label: "Ver rentabilidad", go: "rentabilidad" } };
  }
  return { text: "Puedo responderte sobre facturación, cobros, clientes, trabajos, el equipo o el material. Pregunta como lo harías a alguien de la oficina." };
}

const SUGERENCIAS = (cliente: string) => [
  `¿Cuánto le he facturado a ${cliente} este año?`,
  "¿Qué técnico tiene hueco el jueves?",
  "¿Quién me debe dinero?",
  "¿Cómo van los trabajos de hoy?",
  "¿Qué material me falta?",
  "¿Quiénes son mis mejores clientes?",
];

type Turn = { q: string; a?: Answer };

function AiChat({ compact }: { compact?: boolean }) {
  const sector = useSector();
  const { go } = usePanelNav();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [thinking, setThinking] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const setAiOpen = useUi((s) => s.setAiOpen);
  const ask = (text: string) => {
    if (!text.trim() || thinking) return;
    setTurns((t) => [...t, { q: text }]);
    setQ("");
    setThinking(true);
    setTimeout(() => {
      const a = answer(text, useDemo.getState());
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a } : x)));
      setThinking(false);
    }, 850);
  };
  useEffect(() => {
    const box = end.current?.parentElement;
    box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scroll-thin">
        {!turns.length && (
          <div className="grid gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-ai text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <div className="text-sm font-semibold">Pregúntale a tu empresa</div>
                <div className="text-xs text-fg-3">Responde con tus datos y te lleva a la pantalla correcta.</div>
              </div>
            </div>
            <div className={cn("grid gap-2", !compact && "sm:grid-cols-2")}>
              {SUGERENCIAS(sector.llamada.cliente).map((s) => (
                <button key={s} onClick={() => ask(s)} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-left text-[13px] transition hover:border-ai/50 hover:bg-ai-soft/40">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="grid gap-2">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-fg px-3 py-2 text-[13px] text-bg">{t.q}</div>
            {t.a ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-surface p-3 text-[13px]">
                <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-ai">
                  <Sparkles className="size-3" /> Asistente
                </div>
                <TypeText text={t.a.text} />
                {t.a.bars && (
                  <div className="mt-3 grid gap-1.5">
                    {t.a.bars.map((b) => (
                      <div key={b.label} className="grid grid-cols-[90px_1fr_auto] items-center gap-2 text-xs">
                        <span className="truncate text-fg-2">{b.label}</span>
                        <div className="h-1.5 rounded-full bg-surface-2">
                          <motion.div className="h-full rounded-full bg-ai" initial={{ width: 0 }} animate={{ width: `${(b.value / Math.max(...t.a!.bars!.map((x) => x.value), 1)) * 100}%` }} />
                        </div>
                        <span className="tabular text-fg-3">{b.value > 999 ? fmt.eur0(b.value) : b.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {t.a.link && (
                  <button
                    onClick={() => {
                      go(t.a!.link!.go, t.a!.link!.focus);
                      setAiOpen(false);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-ai-soft px-2 py-1 text-xs font-medium text-ai hover:brightness-95"
                  >
                    {t.a.link.label}
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-fg-3">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="size-3.5 text-ai" />
                </motion.span>
                Consultando tus datos…
              </div>
            )}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escribe tu pregunta" className="h-10 flex-1 rounded-xl border border-line bg-bg px-3 text-sm outline-none focus:border-ai" aria-label="Pregunta" />
        <Button variant="ai" type="submit" className="h-10" aria-label="Preguntar">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function TypeText({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(t), x) : x + 3)), 12);
    return () => clearInterval(t);
  }, [text]);
  return <p className="leading-relaxed">{text.slice(0, n)}</p>;
}

export function AsistenteIA() {
  return (
    <div className="flex h-full flex-col pb-6">
      <PageHeader id="asistente-ia" />
      <Card className="mx-4 flex min-h-[520px] flex-1 flex-col overflow-hidden sm:mx-6">
        <AiChat />
      </Card>
    </div>
  );
}

export function AiDrawer() {
  const open = useUi((s) => s.aiOpen);
  const setOpen = useUi((s) => s.setAiOpen);
  return (
    <Overlay>
      <AnimatePresence>
        {open && (
          <div className="absolute inset-0 z-[70] flex justify-end [body>&]:fixed">
            <motion.div className="absolute inset-0 bg-[#04121a]/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", bounce: 0.1, duration: 0.4 }} className="relative flex h-full w-full max-w-[420px] flex-col border-l border-line bg-bg shadow-e3">
              <div className="flex h-12 items-center justify-between border-b border-line bg-surface px-4">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="size-4 text-ai" /> Asistente IA
                </span>
                <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-fg-2 hover:bg-surface-2" aria-label="Cerrar">
                  <X className="size-4" />
                </button>
              </div>
              <AiChat compact />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </Overlay>
  );
}

/* ---------------- Informe semanal ---------------- */
export function InformesAutomaticos() {
  const invoices = useDemo((s) => s.invoices);
  const jobs = useDemo((s) => s.jobs);
  const avisos = useDemo((s) => s.avisos);
  const sector = useSector();
  const [sent, setSent] = useState(false);
  const { go } = usePanelNav();
  const desde = isoDay(addDays(new Date(), -7));
  const fact = invoices.filter((i) => i.estado !== "borrador" && i.fecha >= desde).reduce((a, i) => a + i.total, 0);
  const cobr = invoices.filter((i) => i.cobradaEn && isoDay(new Date(i.cobradaEn)) >= desde).reduce((a, i) => a + i.total, 0);
  const tr = jobs.filter((j) => j.fecha >= desde && j.fecha <= isoDay(new Date()) && (j.estado === "finalizado" || j.estado === "facturado")).length;
  const venc = invoices.filter((i) => i.estado === "vencida");
  return (
    <div className="pb-8">
      <PageHeader id="informes-automaticos" actions={<Button size="sm" variant="primary" onClick={() => setSent(true)}><Send className="size-3.5" /> {sent ? "Enviado a tu email" : "Enviarme el de esta semana"}</Button>} />
      <div className="px-4 sm:px-6">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-e2">
          <div className="border-b border-line px-5 py-3 text-[13px]">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-fg-3" />
              <span className="font-semibold">Tu semana en {sector.empresa}</span>
              <span className="ml-auto text-xs text-fg-3">Lunes, 7:00</span>
            </div>
            <div className="mt-1 text-xs text-fg-3">De: Nexo4Pymes. Para: dirección</div>
          </div>
          <div className="grid gap-5 p-5">
            <p className="text-[14px]">Buenos días. Esto es lo más importante de los últimos 7 días:</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Facturado", fmt.eur0(fact)],
                ["Cobrado", fmt.eur0(cobr)],
                ["Trabajos hechos", String(tr)],
                ["Avisos recibidos", String(avisos.filter((a) => a.recibido > Date.now() - 7 * 864e5).length)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-surface-2 p-3">
                  <div className="text-[11px] text-fg-3">{k}</div>
                  <div className="font-display text-xl font-semibold tabular">{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[13px] font-semibold">Para esta semana</div>
              <ul className="mt-2 grid gap-1.5 text-[13px] text-fg-2">
                <li>{venc.length} facturas vencidas por {fmt.eur0(venc.reduce((a, i) => a + i.total, 0))}. Ya se han enviado los recordatorios.</li>
                <li>{jobs.filter((j) => j.estado === "pendiente").length} órdenes sin técnico asignado.</li>
                <li>La ITV de una furgoneta vence este mes.</li>
              </ul>
            </div>
            <Button variant="primary" className="justify-self-start" onClick={() => go("direccion")}>Abrir el panel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Automatizaciones ---------------- */
export function Automatizaciones() {
  const flows: { t: string; steps: [ReactNode, string][]; n: number }[] = [
    { t: "Parte cerrado", steps: [[<Check key="a" className="size-3.5" />, "El técnico cierra el parte"], [<Mail key="b" className="size-3.5" />, "Se envía el informe al cliente"], [<FileSpreadsheet key="c" className="size-3.5" />, "Se crea la factura en borrador"], [<Bell key="d" className="size-3.5" />, "Aviso a la oficina"]], n: 312 },
    { t: "Factura sin pagar", steps: [[<CalendarDays key="a" className="size-3.5" />, "Pasan 7 días del vencimiento"], [<Send key="b" className="size-3.5" />, "Recordatorio por WhatsApp"], [<CalendarDays key="c" className="size-3.5" />, "Si a los 15 días sigue igual"], [<Bell key="d" className="size-3.5" />, "Tarea para llamar al cliente"]], n: 48 },
    { t: "Contrato por renovar", steps: [[<CalendarDays key="a" className="size-3.5" />, "Faltan 30 días"], [<Mail key="b" className="size-3.5" />, "Propuesta de renovación con firma"], [<Check key="c" className="size-3.5" />, "Firmado: se generan las visitas del año"]], n: 17 },
    { t: "Stock bajo", steps: [[<Zap key="a" className="size-3.5" />, "Un artículo baja del mínimo"], [<FileSpreadsheet key="b" className="size-3.5" />, "Se prepara el pedido al proveedor"], [<Bell key="c" className="size-3.5" />, "La oficina lo aprueba en un clic"]], n: 23 },
  ];
  return (
    <div className="pb-8">
      <PageHeader id="automatizaciones" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-2">
        {flows.map((f) => (
          <Card key={f.t} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-semibold">
                <Zap className="size-4 text-sun" /> {f.t}
              </div>
              <Badge tone="ok" dot>Activa</Badge>
            </div>
            <div className="mt-4 grid gap-1">
              {f.steps.map(([icon, label], i) => (
                <div key={label}>
                  <motion.div initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-[13px]">
                    <span className="grid size-6 place-items-center rounded-md bg-brand-soft text-brand">{icon}</span>
                    {label}
                  </motion.div>
                  {i < f.steps.length - 1 && <ArrowDown className="mx-auto my-0.5 size-3.5 text-fg-3" />}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-fg-3">Se ha ejecutado {f.n} veces en los últimos 90 días (datos de ejemplo).</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Conexiones ---------------- */
export function Conexiones() {
  const [on, setOn] = useState<Record<string, boolean>>({ gestoria: true, banco: true, email: true, calendario: false, web: true, mapas: true });
  const items: { id: string; t: string; d: string; icon: ReactNode }[] = [
    { id: "gestoria", t: "Tu gestoría", d: "Recibe ingresos, gastos y horas extra cada mes, ya ordenados.", icon: <FileSpreadsheet className="size-5" /> },
    { id: "banco", t: "Tu banco", d: "Movimientos para conciliar cobros y remesas de recibos.", icon: <Banknote className="size-5" /> },
    { id: "email", t: "Tu email", d: "Facturas, informes y presupuestos salen desde tu dirección.", icon: <Mail className="size-5" /> },
    { id: "calendario", t: "Tu calendario", d: "Las visitas aparecen también en el calendario que ya usas.", icon: <CalendarDays className="size-5" /> },
    { id: "web", t: "Tu web", d: "Formularios y reservas que entran directos a Central Avisos.", icon: <Globe className="size-5" /> },
    { id: "mapas", t: "Navegación", d: "Cada parada se abre en el navegador del móvil con un toque.", icon: <MapPinned className="size-5" /> },
  ];
  return (
    <div className="pb-8">
      <PageHeader id="conexiones" />
      <div className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
        {items.map((i) => (
          <Card key={i.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-fg-2">{i.icon}</span>
              <button role="switch" aria-checked={on[i.id]} aria-label={i.t} onClick={() => setOn((s) => ({ ...s, [i.id]: !s[i.id] }))} className={cn("relative h-5 w-9 rounded-full transition-colors", on[i.id] ? "bg-ok" : "bg-line-strong")}>
                <motion.span layout className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow", on[i.id] ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
            <div>
              <div className="text-[14px] font-semibold">{i.t}</div>
              <div className="text-[13px] text-fg-2">{i.d}</div>
            </div>
            <Badge tone={on[i.id] ? "ok" : "neutral"} className="self-start">{on[i.id] ? "Conectado" : "Sin conectar"}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Seguridad ---------------- */
export function Seguridad() {
  const activity = useDemo((s) => s.activity);
  const roles = ["Dueño", "Oficina", "Técnico", "Cliente"];
  const perms: [string, boolean[]][] = [
    ["Ver facturación y cobros", [true, true, false, false]],
    ["Emitir facturas", [true, true, false, false]],
    ["Ver todos los trabajos", [true, true, false, false]],
    ["Ver sus trabajos", [true, true, true, true]],
    ["Cerrar partes y firmar", [true, true, true, false]],
    ["Ver nóminas", [true, true, false, false]],
    ["Ver su nómina", [true, true, true, false]],
    ["Panel de dirección", [true, false, false, false]],
  ];
  return (
    <div className="pb-8">
      <PageHeader id="seguridad" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="overflow-x-auto scroll-thin">
          <CardHeader title="Roles y permisos" sub="Cada persona ve solo lo que necesita" />
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="border-y border-line text-xs text-fg-3">
                <th className="h-9 px-4 text-left font-medium">Permiso</th>
                {roles.map((r) => (
                  <th key={r} className="px-2 font-medium">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map(([p, v]) => (
                <tr key={p} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2">{p}</td>
                  {v.map((x, i) => (
                    <td key={i} className="text-center">
                      {x ? <Check className="mx-auto size-4 text-ok" /> : <span className="text-fg-3">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="grid content-start gap-4">
          <Card className="grid gap-3 p-4">
            {[
              [<ServerCog key="a" className="size-4" />, "Datos alojados en la Unión Europea"],
              [<Lock key="b" className="size-4" />, "Conexión cifrada y copias de seguridad diarias"],
              [<UserCog key="c" className="size-4" />, "Accesos personales, sin contraseñas compartidas"],
              [<ShieldCheck key="d" className="size-4" />, "Registro de quién hace qué y cuándo"],
            ].map(([i, t]) => (
              <div key={String(t)} className="flex items-center gap-3 text-[13px]">
                <span className="grid size-8 place-items-center rounded-lg bg-ok-soft text-ok">{i}</span>
                {t}
              </div>
            ))}
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title="Registro de actividad" sub="Últimas acciones" />
            <div className="max-h-72 divide-y divide-line/60 overflow-auto scroll-thin">
              {activity.slice(0, 15).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2 text-[13px]">
                  <Avatar name={a.texto} color="var(--text-3)" size={20} />
                  <span className="min-w-0 flex-1 truncate">{a.texto}</span>
                  <span className="text-[11px] text-fg-3 tabular">{fmt.time(a.ts)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
