"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgeCheck, Bell, Check, ChevronDown, ClipboardCheck, FileSignature, Mail, MessageCircle, Monitor, Navigation, PhoneIncoming, PlayCircle, Receipt, Sparkles, Wallet, Wrench,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GRUPOS, MODULOS, type ModuleGroup } from "@/data/modules";
import { SECTORES, type SectorId } from "@/data/sectors";
import { CONTACTO, whatsappLink } from "@/data/site";
import { useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { cn, fmt } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { PanelShell } from "@/components/panel/shell";
import { AppShell, PhoneFrame } from "@/components/app/shell";
import { Caustics } from "./caustics";
import { HeroAnim } from "./hero-anim";
import { PruebaAviso } from "./prueba-aviso";
import { ContactDock, SiteFooter, SiteNav, WA_HOLA } from "./chrome";

export function Landing() {
  return (
    <div className="bg-bg text-fg">
      <SiteNav dark />
      <Hero />
      <SectorPicker />
      <Recorrido />
      <PruebaAviso />
      <SoftwareReal />
      <Modulos />
      <Como />
      <Faq />
      <Contacto />
      <SiteFooter />
      <ContactDock />
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#041820] text-white">
      <div className="absolute inset-0">
        <Caustics />
        {/* en móvil el texto ocupa todo el ancho: velo vertical; en escritorio, de izquierda a derecha */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(4_24_32/0.5)_0%,rgb(4_24_32/0.78)_45%,rgb(4_24_32/0.92)_100%)] lg:bg-[linear-gradient(90deg,rgb(4_24_32/0.92)_0%,rgb(4_24_32/0.55)_45%,rgb(4_24_32/0.15)_100%)]" />
        <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#041820]" />
      </div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-24 pb-14 sm:px-6 sm:pt-28 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pt-32 lg:pb-24">
        <div>
          <div className="fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white/80 backdrop-blur sm:text-[13px]">
            <span className="size-1.5 rounded-full bg-sun" /> Panel de oficina y app de técnicos, conectados
          </div>
          <h1 className="fade-up mt-5 font-display text-[42px] leading-[1.02] font-semibold tracking-[-0.03em] min-[400px]:text-[46px] sm:text-[60px] lg:text-[64px]" style={{ animationDelay: "80ms" }}>
            La llamada entra.
            <br />
            <span className="text-[#8fd9ea]">El trabajo sale solo.</span>
          </h1>
          <p className="fade-up mt-4 max-w-xl text-[16px] leading-relaxed text-white/75 sm:mt-5 sm:text-[18px]" style={{ animationDelay: "160ms" }}>
            Recogemos cada llamada y cada WhatsApp de tus clientes, los convertimos en órdenes de trabajo y los mandamos al móvil de tus técnicos. Parte, fotos, firma, factura con VeriFactu y cobro, sin pasar nada a mano.
          </p>
          <div className="fade-up mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap" style={{ animationDelay: "240ms" }}>
            <Link href="/demo?tour=1" className="group flex h-13 items-center justify-center gap-2 rounded-xl bg-sun px-5 text-[16px] font-semibold sm:h-12 sm:text-[15px] text-[#1d1300] shadow-[0_10px_30px_-10px_rgb(245_171_46/0.7)] transition hover:brightness-105">
              <PlayCircle className="size-5" /> Ver la demo en vivo
            </Link>
            <a href={whatsappLink(WA_HOLA)} target="_blank" rel="noreferrer" className="flex h-13 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-[16px] font-medium text-white backdrop-blur transition hover:bg-white/10 sm:h-12 sm:text-[15px]">
              <MessageCircle className="size-5 text-[#5ee39a]" /> Escríbenos por WhatsApp
            </a>
          </div>
          <div className="fade-up mt-8 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-white/65 sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-6" style={{ animationDelay: "400ms" }}>
            {["Sin cambiar de número", "Funciona sin cobertura", "Datos en la UE", "Hecho en Mallorca"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-[#7fe3b8]" /> {t}
              </span>
            ))}
          </div>
        </div>
        <HeroAnim />
      </div>
    </section>
  );
}

/* ---------------- Selector de sector ---------------- */
function SectorPicker() {
  const sector = useSector();
  const setSector = useDemo((s) => s.setSector);
  return (
    <section id="sectores" className="relative scroll-mt-20 bg-[#041820] pb-20 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[26px] leading-tight font-semibold tracking-tight sm:text-[34px]">Elige tu sector y mira la demo con tu día a día</h2>
              <p className="mt-1 text-white/60">La demo cambia la empresa, los servicios, los checklists, las mediciones y los avisos.</p>
            </div>
          </div>
          <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar [mask-image:linear-gradient(90deg,transparent,#000_20px,#000_calc(100%-40px),transparent)] sm:mx-0 sm:px-0 sm:[mask-image:none]">
            {SECTORES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSector(s.id as SectorId)}
                className={cn("flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[14px] font-medium transition", sector.id === s.id ? "border-sun bg-sun text-[#1d1300]" : "border-white/15 text-white/80 hover:bg-white/10")}
                aria-pressed={sector.id === s.id}
              >
                <Icon name={s.icono} className="size-4" />
                {s.nombre}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={sector.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl font-display text-lg font-bold text-white" style={{ background: sector.color }}>
                    {sector.empresaCorta[0]}
                  </span>
                  <div>
                    <div className="text-[13px] text-white/50">Empresa de ejemplo</div>
                    <div className="font-display text-xl font-semibold">{sector.empresa}</div>
                  </div>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-white/75">
                  <span className="text-white/45">El problema de siempre: </span>
                  {sector.dolor}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/demo?sector=${sector.id}&tour=1`} className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-[14px] font-semibold text-[#041820]">
                    <PlayCircle className="size-4" /> Ver la demo<span className="max-sm:hidden"> de {sector.nombre.toLowerCase()}</span>
                  </Link>
                  <Link href={`/sectores/${sector.id}`} className="flex h-10 items-center rounded-lg border border-white/20 px-4 text-[14px] font-medium hover:bg-white/10">
                    Más sobre el sector
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.05] p-4">
                <div className="text-[13px] font-medium text-white/50">Checklist del parte</div>
                <ul className="mt-2 grid gap-1.5 text-[14px]">
                  {sector.checklist.map((c, i) => (
                    <motion.li key={c} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2">
                      <span className="grid size-4 place-items-center rounded-full bg-[#37c28a] text-[#04150e]">
                        <Check className="size-2.5" />
                      </span>
                      {c}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white/[0.05] p-4">
                <div className="text-[13px] font-medium text-white/50">Mediciones en campo</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {sector.mediciones.slice(0, 4).map((m) => (
                    <div key={m.nombre} className="rounded-xl bg-white/[0.06] p-2.5">
                      <div className="text-[11px] text-white/50">{m.nombre}</div>
                      <div className="font-display text-lg font-semibold tabular">
                        {fmt.num((m.ok[0] + m.ok[1]) / 2, m.dec)} <span className="text-xs font-normal text-white/50">{m.unidad}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[13px] font-medium text-white/50">Servicios</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {sector.servicios.map((s) => (
                    <span key={s.nombre} className="rounded-md bg-white/[0.07] px-2 py-1 text-[12px]">
                      {s.nombre}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Recorrido del día ---------------- */
const PASOS: { h: string; t: string; d: string; icon: ReactNode; href: string; tone: string; label: string }[] = [
  { h: "8:02", t: "Llama un cliente", d: "Central Avisos graba, transcribe y clasifica la llamada. También los WhatsApp, emails y formularios.", icon: <PhoneIncoming className="size-4" />, href: "/panel/central-avisos", tone: "bg-sun text-[#1d1300]", label: "Central Avisos" },
  { h: "8:03", t: "La oficina crea la orden", d: "Con el técnico recomendado por zona y carga de trabajo. Un clic.", icon: <Wrench className="size-4" />, href: "/panel/trabajos", tone: "bg-brand text-brand-ink", label: "Órdenes de trabajo" },
  { h: "8:03", t: "Le llega al técnico", d: "Notificación en el móvil con dirección, notas de la oficina e historial del cliente.", icon: <Bell className="size-4" />, href: "/app", tone: "bg-info text-white", label: "App de operarios" },
  { h: "9:10", t: "Va de camino", d: "El cliente recibe un aviso. En la oficina ves en el mapa dónde está cada uno.", icon: <Navigation className="size-4" />, href: "/panel/rutas", tone: "bg-brand text-brand-ink", label: "Rutas" },
  { h: "10:25", t: "Parte con fotos y firma", d: "Checklist, mediciones del sector, material de la furgoneta, fotos y firma con el dedo. Aunque no haya cobertura.", icon: <ClipboardCheck className="size-4" />, href: "/app", tone: "bg-ok text-white", label: "Parte de trabajo" },
  { h: "10:26", t: "Informe al cliente", d: "Un PDF con tu marca, las fotos y la firma, enviado solo.", icon: <FileSignature className="size-4" />, href: "/panel/informes", tone: "bg-ai text-white", label: "Informes" },
  { h: "10:40", t: "Factura con VeriFactu", d: "Sale del parte, con su QR y el enlace de pago. Tú solo la revisas.", icon: <Receipt className="size-4" />, href: "/panel/facturacion", tone: "bg-fg text-bg", label: "Facturación" },
  { h: "12:15", t: "Cobrada por Bizum", d: "El cliente paga desde el móvil y el panel de dirección lo refleja al instante.", icon: <Wallet className="size-4" />, href: "/panel/cobros", tone: "bg-ok text-white", label: "Cobros" },
];

function Recorrido() {
  return (
    <section id="recorrido" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-[30px] leading-tight font-semibold tracking-tight sm:text-[44px]">Un día cualquiera, de la llamada a la factura cobrada</h2>
          <p className="mt-3 text-[17px] text-fg-2">Cada paso es una pantalla real de la demo. Pulsa en cualquiera para verla.</p>
        </div>
        <div className="relative mt-14">
          <div className="absolute top-0 bottom-0 left-[27px] w-px bg-line md:left-1/2" />
          <motion.div className="absolute top-0 left-[27px] w-px origin-top bg-gradient-to-b from-sun to-brand md:left-1/2" initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 2.2, ease: "easeOut" }} style={{ height: "100%" }} />
          <ol className="grid gap-8">
            {PASOS.map((p, i) => (
              <motion.li
                key={p.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className={cn("relative grid items-center gap-4 pl-16 md:grid-cols-2 md:gap-16 md:pl-0", i % 2 && "md:[&>*:first-child]:order-2")}
              >
                <span className={cn("absolute top-1 left-[14px] grid size-[27px] place-items-center rounded-full ring-4 ring-bg md:left-[calc(50%-13px)]", p.tone)}>{p.icon}</span>
                <div className={cn(i % 2 ? "md:pl-4" : "md:pr-4 md:text-right")}>
                  <div className="text-[13px] font-semibold text-fg-3 tabular">{p.h}</div>
                  <div className="font-display text-[24px] font-semibold tracking-tight">{p.t}</div>
                  <p className="mt-1 text-[15px] text-fg-2">{p.d}</p>
                </div>
                <div className={cn(i % 2 ? "md:pr-4 md:text-right" : "md:pl-4")}>
                  <Link href={p.href} className="group inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] font-medium shadow-e1 transition hover:-translate-y-0.5 hover:shadow-e2">
                    <span className={cn("grid size-6 place-items-center rounded-md", p.tone)}>{p.icon}</span>
                    Ver {p.label}
                  </Link>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Software real ---------------- */
function ScaledPanel() {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1280));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShow(true), { rootMargin: "300px" });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);
  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: 780 * scale }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: 1280, height: 780, transform: `scale(${scale})` }}>
        {show ? <PanelShell mode="embedded" /> : <div className="size-full bg-bg" />}
      </div>
    </div>
  );
}

function useWide() {
  const [wide, setWide] = useState<boolean | null>(null);
  const [vw, setVw] = useState(375);
  useEffect(() => {
    const f = () => {
      setWide(window.innerWidth >= 1024);
      setVw(window.innerWidth);
    };
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return { wide, vw };
}

function SoftwareReal() {
  const { wide, vw } = useWide();
  useEffect(() => {
    useUi.getState().setPanelSection("direccion");
  }, []);
  return (
    <section className="relative overflow-hidden bg-surface-2/60 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-[30px] leading-tight font-semibold tracking-tight sm:text-[44px]">No es una maqueta. Tócalo.</h2>
            <p className="mt-3 text-[16px] text-fg-2 sm:text-[17px]">
              <span className="lg:hidden">Esta es la app que llevarían tus técnicos, funcionando con datos de ejemplo. Toca un trabajo, ficha o abre el menú Más.</span>
              <span className="max-lg:hidden">Esto que ves abajo es el panel de oficina funcionando, con datos de ejemplo. Navega, abre fichas, emite una factura. Y el móvil del técnico está conectado.</span>
            </p>
          </div>
          <Link href="/demo" className="hidden h-11 items-center gap-2 rounded-xl bg-fg px-4 text-[14px] font-semibold text-bg lg:flex">
            Abrir a pantalla completa
          </Link>
        </div>
        {wide === true && (
          <div className="mt-10 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-e3">
              <div className="flex h-9 items-center gap-2 border-b border-line bg-surface px-3">
                <span className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 rounded-full bg-[#28c840]" />
                </span>
                <span className="mx-auto rounded-md bg-surface-2 px-3 py-0.5 text-[11px] text-fg-3">panel.nexo4pymes.com</span>
              </div>
              <ScaledPanel />
            </div>
            <div className="flex justify-center">
              <PhoneFrame scale={0.72}>
                <AppShell />
              </PhoneFrame>
            </div>
          </div>
        )}
        {wide === false && (
          <>
            {/* en el móvil el panel de 1280 px no se lee: se enseña la app, que es nativa de esta pantalla */}
            <div className="mt-8 flex justify-center">
              <PhoneFrame scale={Math.min(0.86, (vw - 40) / 390)}>
                <AppShell />
              </PhoneFrame>
            </div>
            <div className="mx-auto mt-6 grid max-w-md gap-2">
              <Link href="/demo?tour=1" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-fg text-[15px] font-semibold text-bg">
                <PlayCircle className="size-5" /> Ver oficina y móvil conectados
              </Link>
              <Link href="/panel" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-[15px] font-medium">
                <Monitor className="size-5 text-brand" /> Abrir el panel de oficina
              </Link>
            </div>
          </>
        )}
        {wide === null && <div className="mt-8 h-[640px]" />}
      </div>
    </section>
  );
}

/* ---------------- Módulos ---------------- */
function Modulos() {
  const groups = Object.keys(GRUPOS) as ModuleGroup[];
  const showEstado = useUi((s) => s.showEstado);
  return (
    <section id="modulos" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-[30px] leading-tight font-semibold tracking-tight sm:text-[44px]">Empieza por lo que más te duele. Añade el resto cuando quieras.</h2>
          <p className="mt-3 text-[17px] text-fg-2">{MODULOS.length} módulos que encajan entre sí. Cada uno tiene su pantalla en la demo.</p>
        </div>

        <Link href="/panel/central-avisos" className="group relative mt-10 block overflow-hidden rounded-3xl bg-[#041820] p-6 text-white sm:p-8">
          <div className="absolute inset-0 opacity-60">
            <Caustics deep="#041820" mid="#0b3a48" light="#f5ab2e" />
          </div>
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sun px-2.5 py-1 text-[12px] font-semibold text-[#1d1300]">
                <PhoneIncoming className="size-3.5" /> Central Avisos
              </div>
              <div className="mt-3 max-w-2xl font-display text-[28px] leading-tight font-semibold tracking-tight">Ningún aviso vuelve a quedarse en un pósit.</div>
              <p className="mt-2 max-w-2xl text-white/70">Llamadas grabadas y transcritas, WhatsApp, email y web en una bandeja. La IA clasifica por tipo, urgencia y cliente, y crea la orden de trabajo en un clic. Mantienes tu número de siempre.</p>
            </div>
            <span className="flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-[#041820] transition group-hover:bg-sun">
              <Sparkles className="size-4" /> Verlo funcionando
            </span>
          </div>
        </Link>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, gi) => (
            <motion.div key={g} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: (gi % 3) * 0.06 }} className="rounded-2xl border border-line bg-surface p-5">
              <div className="font-display text-lg font-semibold">{GRUPOS[g].nombre}</div>
              <div className="text-[13px] text-fg-3">{GRUPOS[g].lema}</div>
              <ul className="mt-4 grid gap-0.5">
                {MODULOS.filter((m) => m.grupo === g).map((m) => (
                  <li key={m.id}>
                    <Link href={`/panel/${m.id}`} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[14px] hover:bg-surface-2">
                      <Icon name={m.icono} className="size-4 text-brand" />
                      <span className="flex-1">{m.nombre}</span>
                      {showEstado && <span className={cn("rounded px-1.5 text-[10px]", m.estado === "disponible" ? "bg-ok-soft text-ok" : "bg-ai-soft text-ai")}>{m.estado === "disponible" ? "disponible" : "a medida"}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/servicios" className="inline-flex h-11 items-center rounded-xl border border-line bg-surface px-4 text-[14px] font-semibold shadow-e1 hover:bg-surface-2">
            Ver el catálogo completo con descripciones
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Cómo trabajamos ---------------- */
function Como() {
  const pasos = [
    { n: "1", t: "Diagnóstico", d: "Vemos cómo trabajáis hoy: quién coge las llamadas, cómo se reparten los trabajos, cómo se factura. Detectamos dónde se pierde más tiempo." },
    { n: "2", t: "Primera versión funcionando", d: "Empezamos por el módulo que más te duele, con tus clientes, tus servicios y tu marca. Tu equipo lo usa desde el primer día." },
    { n: "3", t: "Ampliación por módulos", d: "Cuando lo primero ya funciona, sumamos lo siguiente: facturación, fichaje, almacén… Sin cambiar de sistema cada vez." },
  ];
  return (
    <section id="como" className="scroll-mt-20 bg-[#041820] py-16 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <h2 className="max-w-2xl font-display text-[30px] leading-tight font-semibold tracking-tight sm:text-[44px]">Cómo trabajamos</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pasos.map((p, i) => (
            <motion.div key={p.n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
              <div className="font-display text-[80px] leading-none font-semibold text-white/[0.08]">{p.n}</div>
              <div className="-mt-6 font-display text-[22px] font-semibold">{p.t}</div>
              <p className="mt-2 text-[15px] leading-relaxed text-white/65">{p.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Preguntas ---------------- */
const FAQ = [
  ["¿Qué pasa con mis datos?", "Son tuyos. Se alojan en servidores de la Unión Europea, con copias de seguridad diarias, y puedes exportarlos cuando quieras. Cada persona del equipo ve solo lo que le toca."],
  ["¿Tengo que cambiar de número de teléfono?", "No. Tus clientes siguen llamando al número de siempre. Las llamadas se desvían a Central Avisos, que las atiende, las graba y las registra."],
  ["¿Funciona si el técnico no tiene cobertura?", "Sí. La app guarda el parte, las fotos y la firma en el móvil y lo envía todo en cuanto vuelve la señal. En la demo puedes probarlo desde el menú Más."],
  ["¿Tengo que instalar algo?", "No hace falta tienda de aplicaciones. La app se instala desde el navegador del móvil y el panel se abre en cualquier ordenador o tablet."],
  ["¿Sustituye a mi gestoría?", "No. Las nóminas las sigue haciendo tu gestoría: nosotros se las repartimos a cada trabajador. Y la contabilidad queda ordenada y lista para que tu gestoría trabaje menos."],
  ["¿Cómo se factura?", "Facturación integrada con VeriFactu: la factura sale del parte de trabajo, con su QR, y se envía por email o WhatsApp con enlace de pago."],
  ["¿Cuánto cuesta?", "Depende de los módulos y del tamaño del equipo. Tras el diagnóstico te damos un precio cerrado por escrito, sin sorpresas."],
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="preguntas" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-[30px] leading-tight font-semibold tracking-tight sm:text-[44px]">Preguntas que nos hacen siempre</h2>
          <p className="mt-3 text-[17px] text-fg-2">Respuestas claras. Si falta la tuya, escríbenos.</p>
        </div>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-semibold" aria-expanded={open === i}>
                {q}
                <ChevronDown className={cn("size-5 shrink-0 text-fg-3 transition-transform", open === i && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-fg-2">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Contacto ---------------- */
function Contacto() {
  const sector = useSector();
  const [f, setF] = useState({ nombre: "", empresa: "", tel: "", tecnicos: "2 a 5" });
  const [sent, setSent] = useState(false);
  const msg = `Hola, soy ${f.nombre || "…"} de ${f.empresa || "…"} (${sector.nombre.toLowerCase()}, ${f.tecnicos} técnicos). He visto la demo de Nexo4Pymes y quiero verla con los datos de mi empresa.${f.tel ? ` Mi teléfono: ${f.tel}.` : ""}`;
  const input = "h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-[16px] text-white outline-none placeholder:text-white/35 focus:border-sun";
  return (
    <section id="contacto" className="relative scroll-mt-20 overflow-hidden bg-[#041820] py-16 text-white sm:py-24">
      <div className="absolute inset-0 opacity-70">
        <Caustics />
      </div>
      <div className="absolute inset-0 bg-[#041820]/60" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-[34px] leading-[1.05] font-semibold tracking-tight sm:text-[52px]">Pide tu demo con los datos de tu empresa</h2>
          <p className="mt-4 max-w-lg text-[17px] text-white/70">Te enseñamos esta misma demo con tus servicios, tus clientes y tu marca, para que tu equipo se vea usándola. Sin compromiso.</p>
          <div className="mt-8 grid gap-3 text-[15px]">
            {["Una llamada de 20 minutos para entender cómo trabajáis", "Una demo personalizada con tus datos", "Un precio cerrado por escrito"].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-sun text-[#1d1300]">
                  <Check className="size-3.5" />
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur-xl sm:p-6">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="grid place-items-center gap-3 py-12 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-[#37c28a] text-[#04150e]">
                  <BadgeCheck className="size-7" />
                </span>
                <div className="font-display text-2xl font-semibold">¡Gracias, {f.nombre.split(" ")[0] || "hablamos pronto"}!</div>
                <p className="max-w-sm text-white/70">Se ha abierto WhatsApp con tu mensaje. Si prefieres email, escríbenos a {CONTACTO.email}.</p>
                <button onClick={() => setSent(false)} className="mt-2 text-[14px] text-white/70 underline">
                  Volver al formulario
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="f"
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  window.open(whatsappLink(msg), "_blank", "noopener");
                  setSent(true);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-[13px] text-white/60">
                    Tu nombre
                    <input required className={input} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoComplete="name" />
                  </label>
                  <label className="grid gap-1.5 text-[13px] text-white/60">
                    Empresa
                    <input required className={input} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} autoComplete="organization" />
                  </label>
                  <label className="grid gap-1.5 text-[13px] text-white/60">
                    Teléfono
                    <input type="tel" className={input} value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} autoComplete="tel" />
                  </label>
                  <label className="grid gap-1.5 text-[13px] text-white/60">
                    Técnicos en campo
                    <select className={input} value={f.tecnicos} onChange={(e) => setF({ ...f, tecnicos: e.target.value })}>
                      {["1", "2 a 5", "6 a 15", "Más de 15"].map((x) => (
                        <option key={x} className="text-black">
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="text-[13px] text-white/60">
                  Sector: <span className="text-white">{sector.nombre}</span> <span className="text-white/40">(cámbialo arriba)</span>
                </div>
                <button type="submit" className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-sun text-[15px] font-semibold text-[#1d1300] hover:brightness-105">
                  <MessageCircle className="size-5" /> Enviar por WhatsApp
                </button>
                <a href={`mailto:${CONTACTO.email}?subject=${encodeURIComponent("Quiero una demo con mis datos")}&body=${encodeURIComponent(msg)}`} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 text-[14px] font-medium hover:bg-white/10">
                  <Mail className="size-4" /> Prefiero email
                </a>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
