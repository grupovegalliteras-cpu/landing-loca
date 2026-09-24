"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bot, CalendarDays, Check, CheckCheck, Globe, MessageCircle, Send, Star, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDemo, useSector } from "@/store/demo";
import { addDays, cn, fmt, isoDay } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, Field, inputCls } from "@/components/ui";
import { PageHeader } from "../shell";
import { usePanelNav } from "../nav";

/* ---------------- Asistente de atención ---------------- */
type Msg = { from: "cliente" | "bot" | "sistema"; text: string };

function botReply(q: string, empresa: string, servicios: { nombre: string; precio: number }[]): { text: string; derivar?: boolean; aviso?: boolean } {
  const l = q.toLowerCase();
  if (/horario|abr[ií]s|hora/.test(l)) return { text: `Atendemos de lunes a viernes de 8:00 a 18:00 y los sábados por la mañana. Para urgencias hay un técnico de guardia todos los días.` };
  if (/precio|cu[aá]nto|cuesta|tarifa/.test(l))
    return { text: `Te doy precios orientativos: ${servicios.slice(0, 3).map((s) => `${s.nombre.toLowerCase()} desde ${fmt.eur0(s.precio)}`).join(", ")}, más IVA. Si quieres, te preparo un presupuesto cerrado. ¿Me dices la dirección?` };
  if (/urgente|fuga|no funciona|aver[ií]a|roto|sin luz|verde|no enfr/.test(l))
    return { text: `Lo registro como aviso urgente para que la oficina lo asigne ya. ¿Me confirmas la dirección y un teléfono de contacto?`, aviso: true };
  if (/persona|humano|hablar con|llamad/.test(l)) return { text: `Te paso con una persona de la oficina ahora mismo. Te escribe en unos minutos.`, derivar: true };
  if (/gracias|perfecto|vale/.test(l)) return { text: `A ti. Cualquier cosa, escríbenos por aquí.` };
  return { text: `Soy el asistente de ${empresa}. Puedo darte precios, registrar un aviso o pasarte con la oficina. ¿Qué necesitas?` };
}

export function AsistenteAtencion() {
  const sector = useSector();
  const addReq = useDemo((s) => s.addWebRequest);
  const { go } = usePanelNav();
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "cliente", text: "Hola, ¿cuánto cuesta una revisión?" },
    { from: "bot", text: botReply("precio", sector.empresa, sector.servicios).text },
  ]);
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState(false);
  const [creado, setCreado] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = end.current?.parentElement;
    box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "cliente", text }]);
    setQ("");
    setTyping(true);
    setTimeout(() => {
      const r = botReply(text, sector.empresa, sector.servicios);
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text: r.text }, ...(r.derivar ? [{ from: "sistema" as const, text: "Conversación pasada a la oficina" }] : [])]);
      if (r.aviso) {
        addReq("Cliente por WhatsApp", "600 000 000", text, "whatsapp");
        setCreado(true);
      }
    }, 900);
  };

  return (
    <div className="pb-8">
      <PageHeader id="asistente-atencion" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[28px] border-[6px] border-[#0c1a22] bg-[#e9e3da] shadow-e3 dark:bg-[#0b141a]">
          <div className="flex items-center gap-2.5 bg-[#075e54] px-3 py-2.5 text-white">
            <span className="grid size-8 place-items-center rounded-full text-xs font-bold" style={{ background: sector.color }}>
              {sector.empresaCorta[0]}
            </span>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">{sector.empresa}</div>
              <div className="text-[11px] opacity-80">{typing ? "escribiendo…" : "en línea"}</div>
            </div>
          </div>
          <div className="flex h-[420px] flex-col gap-1.5 overflow-auto p-3 scroll-thin">
            {msgs.map((m, i) =>
              m.from === "sistema" ? (
                <div key={i} className="mx-auto rounded-md bg-[#fff5c4] px-2 py-1 text-[11px] text-[#54491d]">{m.text}</div>
              ) : (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("max-w-[82%] rounded-lg px-2.5 py-1.5 text-[13px] shadow-sm", m.from === "cliente" ? "ml-auto bg-[#d9fdd3] text-[#111b21]" : "bg-white text-[#111b21]")}>
                  {m.from === "bot" && <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#075e54]"><Bot className="size-3" /> Asistente</div>}
                  {m.text}
                  <div className="mt-0.5 flex justify-end text-[10px] text-[#667781]">{m.from === "cliente" && <CheckCheck className="size-3 text-[#53bdeb]" />}</div>
                </motion.div>
              ),
            )}
            {typing && (
              <div className="flex w-14 gap-1 rounded-lg bg-white px-3 py-2.5">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="size-1.5 rounded-full bg-[#667781]" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }} />
                ))}
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(q);
            }}
            className="flex gap-2 bg-[#f0f2f5] p-2 dark:bg-[#202c33]"
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escribe como si fueras un cliente" className="h-9 flex-1 rounded-full bg-white px-3 text-[13px] text-[#111b21] outline-none" aria-label="Mensaje del cliente" />
            <button type="submit" className="grid size-9 place-items-center rounded-full bg-[#00a884] text-white" aria-label="Enviar">
              <Send className="size-4" />
            </button>
          </form>
        </div>
        <div className="grid content-start gap-4">
          <Card className="p-4">
            <div className="text-[13px] font-semibold">Prueba a escribir</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {["¿Qué horario tenéis?", sector.llamada.lineas.find((l) => l[0] === "cliente" && l[1].length > 50)?.[1] ?? "Tengo una avería urgente", "¿Puedo hablar con una persona?"].map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-left text-xs hover:bg-surface-2">
                  {s}
                </button>
              ))}
            </div>
          </Card>
          <AnimatePresence>
            {creado && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="flex items-center gap-3 border-ok/40 bg-ok-soft p-4 text-ok">
                  <Check className="size-5" />
                  <div className="flex-1 text-[13px]">El asistente ha recogido los datos y ha creado un aviso en Central Avisos.</div>
                  <Button size="sm" variant="secondary" onClick={() => go("central-avisos")}>Ver aviso</Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Responde a cualquier hora", "Precios orientativos, horarios y dudas frecuentes con tus propios textos."],
                ["Recoge el aviso completo", "Dirección, teléfono, qué pasa y fotos, antes de que llegue a la oficina."],
                ["Sabe cuándo parar", "Si el cliente lo pide o el caso lo necesita, pasa la conversación a una persona."],
              ].map(([t, d]) => (
                <div key={t}>
                  <div className="text-[13px] font-semibold">{t}</div>
                  <div className="mt-1 text-xs text-fg-2">{d}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Web y reservas ---------------- */
export function WebReservas() {
  const sector = useSector();
  const addReq = useDemo((s) => s.addWebRequest);
  const { go } = usePanelNav();
  const [f, setF] = useState({ nombre: "", tel: "", texto: "" });
  const [dia, setDia] = useState<string>();
  const [hora, setHora] = useState<string>();
  const [ok, setOk] = useState(false);
  const days = Array.from({ length: 10 }, (_, i) => addDays(new Date(), i + 1)).filter((d) => d.getDay() !== 0).slice(0, 6);
  return (
    <div className="pb-8">
      <PageHeader id="web-reservas" />
      <div className="px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-line shadow-e2">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2 text-xs text-fg-3">
            <Globe className="size-3.5" />
            <span className="rounded-md bg-surface-2 px-2 py-0.5">www.{sector.empresa.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "")}.es</span>
          </div>
          <div className="grid lg:grid-cols-2">
            <div className="relative overflow-hidden p-8 text-white" style={{ background: `linear-gradient(135deg, ${sector.color}, #0c1a22)` }}>
              <div className="font-display text-3xl font-semibold leading-tight">{sector.empresa}</div>
              <div className="mt-2 max-w-sm text-white/80">{sector.lema} en toda Mallorca. Respuesta en el día.</div>
              <div className="mt-6 grid gap-2 text-sm">
                {sector.servicios.slice(0, 4).map((s) => (
                  <div key={s.nombre} className="flex items-center gap-2">
                    <Check className="size-4 text-sun" /> {s.nombre}
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full bg-white/10" />
            </div>
            <div className="bg-surface p-6">
              <AnimatePresence mode="wait">
                {ok ? (
                  <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="grid h-full place-items-center gap-3 py-10 text-center">
                    <span className="grid size-12 place-items-center rounded-full bg-ok text-white">
                      <Check className="size-6" />
                    </span>
                    <div className="font-semibold">Solicitud enviada</div>
                    <p className="max-w-xs text-sm text-fg-2">Ya está en la bandeja de la oficina, con la cita reservada {dia && hora ? `el ${fmt.date(dia)} a las ${hora}` : ""}.</p>
                    <Button variant="primary" onClick={() => go("central-avisos")}>Verla en Central Avisos</Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="f"
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      addReq(f.nombre || "Contacto web", f.tel, `${f.texto || "Solicitud de presupuesto desde la web"}${dia && hora ? `. Cita pedida el ${fmt.date(dia)} a las ${hora}.` : ""}`);
                      setOk(true);
                    }}
                  >
                    <div className="font-display text-lg font-semibold">Pide presupuesto o reserva visita</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nombre">
                        <input className={inputCls} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
                      </Field>
                      <Field label="Teléfono">
                        <input className={inputCls} value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} inputMode="tel" />
                      </Field>
                    </div>
                    <Field label="¿Qué necesitas?">
                      <textarea className={cn(inputCls, "h-20 py-2")} value={f.texto} onChange={(e) => setF({ ...f, texto: e.target.value })} placeholder="Cuéntanos brevemente" />
                    </Field>
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-2">
                        <CalendarDays className="size-3.5" /> Elige día y hora
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {days.map((d) => (
                          <button type="button" key={d.toISOString()} onClick={() => setDia(isoDay(d))} className={cn("rounded-lg border px-1 py-1.5 text-center text-xs", dia === isoDay(d) ? "border-brand bg-brand-soft text-brand" : "border-line hover:bg-surface-2")}>
                            <div className="capitalize">{fmt.dayName(d).slice(0, 3)}</div>
                            <div className="font-semibold">{d.getDate()}</div>
                          </button>
                        ))}
                      </div>
                      {dia && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {["09:00", "10:30", "12:00", "16:00", "17:30"].map((h, i) => (
                            <button type="button" key={h} disabled={i === 2} onClick={() => setHora(h)} className={cn("rounded-md border px-2.5 py-1 text-xs tabular disabled:opacity-40 disabled:line-through", hora === h ? "border-brand bg-brand text-brand-ink" : "border-line hover:bg-surface-2")}>
                              {h}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button variant="primary" type="submit">Enviar solicitud</Button>
                    <p className="text-[11px] text-fg-3">Los huecos salen de la planificación real del equipo.</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Recordatorios ---------------- */
export function Recordatorios() {
  const sector = useSector();
  const [on, setOn] = useState<Record<string, boolean>>({ a: true, b: true, c: true, d: false });
  const [prev, setPrev] = useState("b");
  const items = [
    { id: "a", t: "Confirmación de la visita", w: "El día antes, a las 18:00", m: `Hola, le recordamos que mañana a las 10:30 le visita nuestro técnico de ${sector.empresa}. Si necesita cambiar la hora, responda a este mensaje.` },
    { id: "b", t: "El técnico va de camino", w: "Cuando el técnico pulsa «Salgo hacia allí»", m: `Toni, de ${sector.empresa}, va de camino. Llegará en unos 15 minutos.` },
    { id: "c", t: "Encuesta al terminar", w: "Al cerrar el parte con firma", m: "¿Qué tal ha ido el servicio de hoy? Responda con un número del 1 al 5." },
    { id: "d", t: "Aviso de revisión periódica", w: "15 días antes de cada preventivo", m: "Se acerca la revisión de su instalación. Le propondremos fecha en los próximos días." },
  ];
  const p = items.find((i) => i.id === prev)!;
  return (
    <div className="pb-8">
      <PageHeader id="recordatorios" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="divide-y divide-line/70">
          {items.map((i) => (
            <div key={i.id} className={cn("flex cursor-pointer items-center gap-3 px-4 py-3", prev === i.id && "bg-brand-soft/40")} onClick={() => setPrev(i.id)}>
              <MessageCircle className="size-4 text-ok" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{i.t}</div>
                <div className="text-xs text-fg-3">{i.w}</div>
              </div>
              <button
                role="switch"
                aria-checked={on[i.id]}
                aria-label={i.t}
                onClick={(e) => {
                  e.stopPropagation();
                  setOn((s) => ({ ...s, [i.id]: !s[i.id] }));
                }}
                className={cn("relative h-5 w-9 rounded-full transition-colors", on[i.id] ? "bg-ok" : "bg-line-strong")}
              >
                <motion.span layout className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow", on[i.id] ? "right-0.5" : "left-0.5")} />
              </button>
            </div>
          ))}
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-3">Así le llega al cliente</div>
          <div className="mt-3 rounded-2xl bg-[#e9e3da] p-4 dark:bg-[#0b141a]">
            <AnimatePresence mode="wait">
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-[90%] rounded-lg bg-white px-3 py-2 text-[13px] text-[#111b21] shadow-sm">
                {p.m}
                <div className="mt-1 text-right text-[10px] text-[#667781]">10:14</div>
              </motion.div>
            </AnimatePresence>
          </div>
          <Badge tone={on[p.id] ? "ok" : "neutral"} className="mt-3">{on[p.id] ? "Activo" : "Desactivado"}</Badge>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Reseñas ---------------- */
export function Resenas() {
  const sector = useSector();
  const [sent, setSent] = useState(false);
  const ops = [
    { n: "Carmen S.", s: 5, t: "Vinieron el mismo día y dejaron todo limpio. Muy profesionales." },
    { n: "Tomeu G.", s: 5, t: "Nos mandaron fotos y el informe al terminar, así da gusto." },
    { n: "Laura R.", s: 4, t: "Buen trabajo y puntuales. El presupuesto llegó rapidísimo." },
  ];
  return (
    <div className="pb-8">
      <PageHeader id="resenas" />
      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="p-4">
          <div className="text-[13px] font-semibold">Cómo funciona</div>
          <ol className="mt-3 grid gap-3 text-[13px]">
            {["El técnico cierra el parte y el cliente firma.", "Llega la encuesta: ¿qué tal ha ido, del 1 al 5?", "Si responde 4 o 5, recibe el enlace para dejar su reseña en Google.", "Si responde menos, avisamos a la oficina para llamarle antes."].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <Button variant="primary" className="mt-4 w-full" onClick={() => setSent(true)} disabled={sent}>
            {sent ? <><Check className="size-4" /> Invitaciones enviadas a los clientes de hoy</> : <><Star className="size-4" /> Pedir reseña a los clientes de hoy</>}
          </Button>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title={`Últimas opiniones de ${sector.empresa}`} sub="Ejemplo con datos ficticios" />
          <div className="divide-y divide-line/70">
            {ops.map((o) => (
              <div key={o.n} className="flex gap-3 px-4 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2">
                  <UserRound className="size-4 text-fg-3" />
                </span>
                <div>
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    {o.n}
                    <span className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("size-3", i < o.s ? "fill-sun text-sun" : "text-line-strong")} />
                      ))}
                    </span>
                  </div>
                  <p className="text-[13px] text-fg-2">{o.t}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
