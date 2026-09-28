"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, MessageCircle, PlayCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CONTACTO, whatsappLink } from "@/data/site";
import { Logo } from "./logo";

const LINKS = [
  ["Producto", "/#recorrido"],
  ["Sectores", "/#sectores"],
  ["Servicios", "/servicios"],
  ["Cómo trabajamos", "/#como"],
  ["Preguntas", "/#preguntas"],
] as const;

export function SiteNav({ dark = false }: { dark?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const onDark = dark && !scrolled;
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,border-color] duration-300", scrolled ? "border-b border-line bg-bg/85 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Nexo4Pymes, inicio" className="h-7 text-[17px]">
          <Logo light={onDark} className="h-7" />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {LINKS.map(([l, h]) => (
            <Link key={h} href={h} className={cn("rounded-lg px-3 py-2 text-[14px] font-medium transition-colors", onDark ? "text-white/75 hover:text-white" : "text-fg-2 hover:text-fg")}>
              {l}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/demo" className={cn("hidden h-9 items-center rounded-lg px-3.5 text-[14px] font-medium sm:flex", onDark ? "text-white hover:bg-white/10" : "text-fg hover:bg-surface-2")}>
            Abrir la demo
          </Link>
          <Link href="/#contacto" className="flex h-9 items-center rounded-lg bg-sun px-3.5 text-[14px] font-semibold text-[#1d1300] shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] hover:brightness-105">
            Pide tu demo
          </Link>
          <button onClick={() => setOpen(true)} className={cn("grid size-9 place-items-center rounded-lg lg:hidden", onDark ? "text-white" : "text-fg")} aria-label="Abrir menú">
            <Menu className="size-5" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-bg p-4 lg:hidden">
            <div className="flex items-center justify-between">
              <Logo className="h-7" />
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center" aria-label="Cerrar menú">
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-8 grid gap-1">
              {[...LINKS, ["Abrir la demo", "/demo"] as const].map(([l, h]) => (
                <Link key={h} href={h} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 font-display text-2xl font-semibold">
                  {l}
                </Link>
              ))}
            </nav>
            <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] grid gap-2">
              <a href={whatsappLink(WA_HOLA)} target="_blank" rel="noreferrer" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#1faa59] text-[16px] font-semibold text-white">
                <MessageCircle className="size-5" /> Escríbenos por WhatsApp
              </a>
              <div className="text-center text-[13px] text-fg-3">{CONTACTO.whatsappVisible} · {CONTACTO.ciudad}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export const WA_HOLA = "Hola, he visto la demo de Nexo4Pymes y me gustaría verla con los datos de mi empresa.";

/**
 * Acceso fijo a la demo y a WhatsApp. En móvil es una barra abajo, al alcance del pulgar;
 * en escritorio, un botón flotante. Aparece al bajar y se aparta al llegar al formulario.
 */
export function ContactDock({ demoHref = "/demo?tour=1", mensaje = WA_HOLA }: { demoHref?: string; mensaje?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // se aparta en el formulario y en las secciones donde se escribe
    const zonas = [document.getElementById("contacto"), ...document.querySelectorAll("[data-hide-dock]")].filter((x): x is HTMLElement => !!x);
    const dentro = new Set<Element>();
    const upd = () => setShow(window.scrollY > 520 && dentro.size === 0);
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? dentro.add(e.target) : dentro.delete(e.target)));
      upd();
    }, { rootMargin: "-25% 0px -25% 0px" });
    zonas.forEach((z) => io.observe(z));
    upd();
    window.addEventListener("scroll", upd, { passive: true });
    return () => {
      window.removeEventListener("scroll", upd);
      io.disconnect();
    };
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="bar"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-md gap-2">
              <Link href={demoHref} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-fg text-[15px] font-semibold text-bg">
                <PlayCircle className="size-5" /> Ver la demo
              </Link>
              <a href={whatsappLink(mensaje)} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1faa59] text-[15px] font-semibold text-white">
                <MessageCircle className="size-5" /> WhatsApp
              </a>
            </div>
          </motion.div>
          <motion.a
            key="fab"
            href={whatsappLink(mensaje)}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed right-6 bottom-6 z-40 hidden h-12 items-center gap-2 rounded-full bg-[#1faa59] pr-5 pl-4 text-[15px] font-semibold text-white shadow-e3 transition hover:brightness-110 lg:flex"
          >
            <MessageCircle className="size-5" /> ¿Hablamos?
          </motion.a>
        </>
      )}
    </AnimatePresence>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface pb-20 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo className="h-7 text-[17px]" />
          <p className="mt-3 max-w-xs text-[14px] text-fg-2">Paneles de gestión y apps para empresas de servicios, con automatización e inteligencia artificial. Desde {CONTACTO.ciudad}.</p>
          <a href={whatsappLink(WA_HOLA)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[14px] font-medium hover:bg-surface-2">
            <MessageCircle className="size-4 text-ok" /> WhatsApp {CONTACTO.whatsappVisible}
          </a>
        </div>
        {[
          ["Demo", [["Modo presentación", "/demo"], ["Panel de oficina", "/panel"], ["App de operarios", "/app"], ["Ver recorrido guiado", "/demo?tour=1"]]],
          ["Producto", [["Central Avisos", "/panel/central-avisos"], ["Catálogo de servicios", "/servicios"], ["Facturación con VeriFactu", "/panel/facturacion"], ["Fichaje", "/panel/fichaje"]]],
          ["Sectores", [["Mantenimiento", "/sectores/mantenimiento"], ["Piscinas", "/sectores/piscinas"], ["Climatización", "/sectores/climatizacion"], ["Limpieza", "/sectores/limpieza"]]],
        ].map(([t, ls]) => (
          <div key={t as string}>
            <div className="text-[13px] font-semibold">{t as string}</div>
            <ul className="mt-3 grid gap-2">
              {(ls as string[][]).map(([l, h]) => (
                <li key={h}>
                  <Link href={h} className="text-[14px] text-fg-2 hover:text-fg">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-4 text-[12px] text-fg-3 sm:px-6">
          <span>Nexo4Pymes, {CONTACTO.ciudad}</span>
          <span>Todas las empresas, personas y cifras de esta demo son ficticias.</span>
          <Link href="/privacidad" className="hover:text-fg">
            Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
