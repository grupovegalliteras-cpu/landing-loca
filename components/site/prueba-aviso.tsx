"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bell, BrainCircuit, CheckCheck, ClipboardList, Inbox, MessageCircle, RotateCcw, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { whatsappLink } from "@/data/site";
import { leer, type Lectura } from "@/lib/lectura-aviso";
import { useDemo, useSector } from "@/store/demo";
import { cn, fmt, isoDay } from "@/lib/utils";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const hhmm = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;

function cuando(urg: Lectura["urgencia"], tipo: Lectura["tipo"]) {
  const now = new Date();
  if (urg === "alta") {
    const d = new Date(now.getTime() + 90 * 60000);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    if (d.getHours() < 20) return { corto: `Hoy, ${hhmm(d)}`, largo: `hoy sobre las ${hhmm(d)}`, hora: hhmm(d) };
  }
  const d = new Date(now);
  let add = urg === "media" || tipo === "queja" ? 1 : 2;
  while (add > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) add--;
  }
  const h = urg === "baja" ? "10:00" : "9:00";
  const manana = (d.getTime() - now.getTime()) / 86400000 < 1.5;
  return { corto: `${manana ? "Mañana" : DIAS[d.getDay()][0].toUpperCase() + DIAS[d.getDay()].slice(1)}, ${h}`, largo: `${manana ? "mañana" : `el ${DIAS[d.getDay()]}`} a las ${h}`, hora: h };
}

/* ---------- Componente ---------- */

type Msg = { de: "cliente" | "empresa"; texto: string; hora: string };
const PASOS = 5;

export function PruebaAviso() {
  const router = useRouter();
  const sector = useSector();
  const techs = useDemo((s) => s.techs);
  const jobs = useDemo((s) => s.jobs);
  const addWebRequest = useDemo((s) => s.addWebRequest);
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [paso, setPaso] = useState(0);
  const [escribiendo, setEscribiendo] = useState(false);
  const [ms, setMs] = useState(0);
  const [ot, setOt] = useState(0);
  const timers = useRef<number[]>([]);
  const pipe = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLDivElement>(null);

  const ejemplos = useMemo(() => {
    // cada ejemplo es lo que dice el cliente entero, sin las respuestas de la oficina
    const delCliente = (ls: [string, string][]) => ls.filter((x) => x[0] === "cliente").map((x) => x[1]).join(" ");
    const l = [delCliente(sector.llamada.lineas), ...sector.avisos.map((a) => delCliente(a.lineas))];
    return l.filter((x) => x.length > 20).slice(0, 4);
  }, [sector]);

  const lectura = useMemo(() => (enviado ? leer(enviado, sector) : null), [enviado, sector]);
  const tecnico = useMemo(() => {
    if (!lectura) return null;
    const hoy = isoDay(new Date());
    const carga = (id: string) => jobs.filter((j) => j.techId === id && j.fecha === hoy && j.estado !== "finalizado" && j.estado !== "facturado").length;
    const zona = techs.filter((t) => t.zona.includes(lectura.municipio));
    return [...(zona.length ? zona : techs)].sort((a, b) => carga(a.id) - carga(b.id))[0] ?? null;
  }, [lectura, techs, jobs]);
  const cita = useMemo(() => (lectura ? cuando(lectura.urgencia, lectura.tipo) : null), [lectura]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // si cambia el sector, se empieza de cero
  useEffect(() => {
    reiniciar();
  }, [sector.id]);

  // cronómetro visible mientras la empresa «trabaja»
  useEffect(() => {
    if (!enviado || paso >= PASOS) return;
    const t0 = performance.now() - ms;
    const iv = window.setInterval(() => setMs(performance.now() - t0), 50);
    return () => clearInterval(iv);
  }, [enviado, paso >= PASOS]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: "smooth" });
  }, [msgs, escribiendo]);

  function reiniciar() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setEnviado(null);
    setMsgs([]);
    setPaso(0);
    setMs(0);
    setEscribiendo(false);
  }

  function enviar(txt: string) {
    const limpio = txt.trim();
    if (limpio.length < 6 || enviado) return;
    const ahora = hhmm(new Date());
    setMsgs([{ de: "cliente", texto: limpio, hora: ahora }]);
    setEnviado(limpio);
    setTexto("");
    setMs(0);
    setOt(3300 + Math.floor(Math.random() * 600));
    const at = (t: number, f: () => void) => timers.current.push(window.setTimeout(f, t));
    at(500, () => setPaso(1));
    at(1300, () => setPaso(2));
    at(2300, () => setPaso(3));
    at(3100, () => setPaso(4));
    at(3300, () => setEscribiendo(true));
    at(4200, () => {
      setEscribiendo(false);
      setPaso(5);
    });
    // en el móvil el resultado queda debajo: lo acercamos
    if (window.innerWidth < 1024) at(350, () => pipe.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // la respuesta al cliente se escribe cuando todo lo demás está listo
  useEffect(() => {
    if (paso !== 5 || !lectura || !tecnico || !cita) return;
    const nombre = tecnico.nombre.split(" ")[0];
    const r =
      lectura.tipo === "presupuesto"
        ? `Hola, somos ${sector.empresa}. Te preparamos el presupuesto de ${lectura.servicio.nombre.toLowerCase()} (desde ${fmt.eur0(lectura.servicio.precio)}) y te lo enviamos hoy por aquí. Si quieres, ${nombre} puede pasar ${cita.largo} a verlo.`
        : lectura.tipo === "queja"
          ? `Hola, somos ${sector.empresa}. Sentimos mucho lo ocurrido. Lo hemos abierto como garantía y ${nombre} pasará ${cita.largo}, sin coste. Te avisamos cuando vaya de camino.`
          : lectura.tipo === "consulta"
            ? `Hola, somos ${sector.empresa}. Hemos recibido tu mensaje y lo tiene ya la oficina. Te dejamos a ${nombre} reservado ${cita.largo} por si hace falta pasar.`
            : `Hola, somos ${sector.empresa}. Recibido: ${lectura.servicio.nombre.toLowerCase()}${lectura.municipioDicho ? ` en ${lectura.municipio}` : ""}. ${nombre} pasará ${cita.largo}. Te avisamos cuando vaya de camino.`;
    setMsgs((m) => (m.some((x) => x.de === "empresa") ? m : [...m, { de: "empresa", texto: r, hora: hhmm(new Date()) }]));
  }, [paso, lectura, tecnico, cita, sector.empresa]);

  function verEnPanel() {
    if (!enviado) return;
    addWebRequest("Tu mensaje de prueba", "", enviado, "whatsapp", lectura ? { tipo: lectura.tipo, urgencia: lectura.urgencia, resumen: lectura.resumen, servicio: Math.max(0, sector.servicios.indexOf(lectura.servicio)) } : undefined);
    router.push("/panel/central-avisos");
  }

  const urgColor = lectura?.urgencia === "alta" ? "bg-[#ff6b61]/15 text-[#ff8a82]" : lectura?.urgencia === "media" ? "bg-sun/15 text-sun" : "bg-white/10 text-white/80";
  const segundos = (ms / 1000).toFixed(1).replace(".", ",");
  const fin = paso >= PASOS;

  return (
    <section id="pruebalo" data-hide-dock className="relative scroll-mt-20 overflow-hidden bg-[#061c25] py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgb(15_90_112/0.55),transparent_60%),radial-gradient(ellipse_at_90%_100%,rgb(245_171_46/0.10),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-sun px-2.5 py-1 text-[12px] font-semibold text-[#1d1300]">
            <span className="size-1.5 rounded-full bg-[#1d1300]" /> Pruébalo tú
          </div>
          <h2 className="mt-4 font-display text-[32px] leading-[1.05] font-semibold tracking-tight sm:text-[48px]">Escribe como si fueras tu cliente. Mira lo que pasa.</h2>
          <p className="mt-3 text-[16px] text-white/70 sm:text-[18px]">
            Manda un aviso a {sector.empresa}, la empresa de ejemplo, con tus palabras: una avería, un presupuesto, una queja. Incluye el pueblo si quieres.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-8">
          {/* Chat del cliente */}
          <div className="flex h-[520px] min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b141a] shadow-e3 sm:h-[560px]">
            <div className="flex items-center gap-3 border-b border-white/10 bg-[#111d24] px-4 py-3">
              <span className="grid size-10 place-items-center rounded-full font-display text-[15px] font-bold" style={{ background: sector.color }}>
                {sector.empresaCorta[0]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{sector.empresa}</div>
                <div className="text-[12px] text-[#5ee39a]">{escribiendo ? "escribiendo…" : "en línea"}</div>
              </div>
              {enviado && (
                <button onClick={reiniciar} className="grid size-9 place-items-center rounded-full text-white/60 hover:bg-white/10" aria-label="Probar otro mensaje">
                  <RotateCcw className="size-4" />
                </button>
              )}
            </div>
            <div ref={chat} className="flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(rgb(255_255_255/0.035)_1px,transparent_1px)] [background-size:14px_14px] px-3 py-4">
              {!msgs.length && (
                <div className="mx-auto mt-2 max-w-[260px] rounded-xl bg-white/[0.06] px-3 py-2 text-center text-[12px] text-white/55">
                  Toca un ejemplo o escribe el tuyo. Nadie de la oficina va a intervenir.
                </div>
              )}
              <AnimatePresence initial={false}>
                {msgs.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={cn("flex", m.de === "cliente" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-[14px] leading-snug shadow-sm", m.de === "cliente" ? "rounded-br-md bg-[#0f5a4a] text-white" : "rounded-bl-md bg-[#1c2a32] text-white")}>
                      {m.texto}
                      <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/45">
                        {m.hora} {m.de === "cliente" && <CheckCheck className={cn("size-3", paso >= 1 && "text-[#53bdeb]")} />}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {escribiendo && (
                  <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex">
                    <div className="flex gap-1 rounded-2xl rounded-bl-md bg-[#1c2a32] px-3 py-3">
                      {[0, 1, 2].map((d) => (
                        <motion.span key={d} className="size-1.5 rounded-full bg-white/60" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!enviado && (
              <div className="flex gap-2 overflow-x-auto px-3 pb-2 no-scrollbar">
                {ejemplos.map((e) => (
                  <button key={e} onClick={() => enviar(e)} className="max-w-[240px] shrink-0 truncate rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/80 hover:bg-white/10">
                    {e}
                  </button>
                ))}
              </div>
            )}
            <form
              className="flex items-center gap-2 border-t border-white/10 bg-[#111d24] p-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                enviar(texto);
              }}
            >
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                disabled={!!enviado}
                placeholder={enviado ? "Mensaje enviado" : "Escribe tu aviso…"}
                className="h-11 min-w-0 flex-1 rounded-full bg-white/[0.07] px-4 text-[16px] text-white outline-none placeholder:text-white/35 focus:bg-white/10 disabled:opacity-50"
                aria-label="Tu mensaje como cliente"
                enterKeyHint="send"
              />
              <button type="submit" disabled={!!enviado || texto.trim().length < 6} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1faa59] text-white transition disabled:opacity-40" aria-label="Enviar">
                <Send className="size-5" />
              </button>
            </form>
          </div>

          {/* Lo que hace la empresa sola */}
          <div ref={pipe} className="min-w-0 scroll-mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[13px] font-medium text-white/60">Mientras tanto, en tu empresa</div>
              <div className={cn("rounded-lg px-2.5 py-1 font-display text-[15px] font-semibold tabular", fin ? "bg-[#37c28a]/15 text-[#7fe3b8]" : "bg-white/10 text-white/80")}>
                {segundos} s
              </div>
            </div>
            <ol className="mt-4 grid gap-2.5">
              <Paso n={1} activo={paso >= 1} icon={<Inbox className="size-4" />} titulo="Recibido en Central Avisos">
                {lectura && (
                  <span>
                    WhatsApp, {hhmm(new Date())}. «{lectura.resumen}»
                  </span>
                )}
              </Paso>
              <Paso n={2} activo={paso >= 2} icon={<BrainCircuit className="size-4" />} titulo="Entendido por la IA" tono="ai">
                {lectura && (
                  <div className="flex flex-wrap gap-1.5">
                    <Chip>{lectura.tipo[0].toUpperCase() + lectura.tipo.slice(1)}</Chip>
                    <Chip className={urgColor}>Urgencia {lectura.urgencia}</Chip>
                    <Chip>
                      {lectura.servicio.nombre} · desde {fmt.eur0(lectura.servicio.precio)}
                    </Chip>
                    <Chip>{lectura.municipioDicho ? lectura.municipio : "Zona por confirmar"}</Chip>
                  </div>
                )}
              </Paso>
              <Paso n={3} activo={paso >= 3} icon={<ClipboardList className="size-4" />} titulo={ot && paso >= 3 ? `Orden de trabajo OT-${ot} creada` : "Orden de trabajo creada"}>
                {tecnico && cita && (
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: tecnico.color }}>
                      {tecnico.nombre.split(" ").map((p) => p[0]).join("")}
                    </span>
                    <span>
                      <span className="font-semibold text-white">{tecnico.nombre}</span>, {lectura!.municipioDicho ? `técnico de la zona de ${lectura!.municipio}` : "el técnico"} con menos carga hoy. <span className="text-white">{cita.corto}</span>, {fmt.dur(lectura!.servicio.min)}.
                    </span>
                  </div>
                )}
              </Paso>
              <Paso n={4} activo={paso >= 4} icon={<Bell className="size-4" />} titulo="En el móvil del técnico">
                {tecnico && cita && lectura && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-[#1a2830] p-2.5 shadow-e2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#3db1d3] text-[#041319]">
                      <Bell className="size-3.5" />
                    </span>
                    <div className="min-w-0 text-[12px] leading-snug">
                      <div className="flex justify-between text-white/50">
                        <span>Nexo Campo</span>
                        <span>ahora</span>
                      </div>
                      <div className="font-semibold text-white">{lectura.urgencia === "alta" ? "Trabajo urgente asignado" : "Nuevo trabajo asignado"}</div>
                      <div className="truncate text-white/75">
                        {lectura.servicio.nombre} · {cita.corto}
                      </div>
                    </div>
                  </div>
                )}
              </Paso>
              <Paso n={5} activo={paso >= 5} icon={<MessageCircle className="size-4" />} titulo="Respuesta enviada al cliente" tono="ok">
                {fin && (
                  <>
                    <span className="lg:hidden">«{msgs.find((m) => m.de === "empresa")?.texto}»</span>
                    <span className="max-lg:hidden">Con técnico y hora. Míralo en el chat.</span>
                  </>
                )}
              </Paso>
            </ol>

            <AnimatePresence>
              {fin && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 border-t border-white/10 pt-5">
                  <div className="font-display text-[20px] leading-tight font-semibold sm:text-[24px]">
                    Todo en {segundos} segundos. <span className="text-white/60">Sin que nadie de la oficina toque nada.</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <a
                      href={whatsappLink(`Hola, he probado a mandar un aviso en vuestra demo y quiero esto para mi empresa. El mensaje era: «${enviado}»`)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sun text-[15px] font-semibold text-[#1d1300] hover:brightness-105"
                    >
                      <MessageCircle className="size-5" /> Lo quiero en mi empresa
                    </a>
                    <button onClick={verEnPanel} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 text-[15px] font-medium hover:bg-white/10">
                      Verlo en el panel de oficina <ArrowRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Paso({ n, activo, icon, titulo, tono, children }: { n: number; activo: boolean; icon: React.ReactNode; titulo: string; tono?: "ai" | "ok"; children?: React.ReactNode }) {
  return (
    <li className={cn("relative flex gap-3 rounded-2xl border p-3 transition-colors duration-500", activo ? "border-white/12 bg-white/[0.05]" : "border-white/[0.06] bg-transparent")}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-500",
          !activo ? "bg-white/[0.06] text-white/30" : tono === "ai" ? "bg-[#9d8fff] text-[#140f33]" : tono === "ok" ? "bg-[#37c28a] text-[#04150e]" : "bg-sun text-[#1d1300]",
        )}
      >
        {activo ? icon : <span className="text-[12px] font-semibold">{n}</span>}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className={cn("text-[14px] font-semibold transition-colors", activo ? "text-white" : "text-white/35")}>{titulo}</div>
        <AnimatePresence>
          {activo && children && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <div className="pt-1.5 text-[13px] leading-snug text-white/70">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("rounded-md bg-white/10 px-2 py-0.5 text-[12px] font-medium text-white/85", className)}>{children}</span>;
}
