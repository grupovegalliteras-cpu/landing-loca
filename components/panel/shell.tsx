"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Bell, ChevronDown, Command, Menu, Moon, PhoneIncoming, RotateCcw, Search, Sparkles, Sun, MessageCircle, X, Radio,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GRUPOS, MODULOS, MODULO_POR_ID, type ModuleGroup } from "@/data/modules";
import { SECTORES } from "@/data/sectors";
import { useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { cn, fmt } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Avatar, Badge, IconButton, Kbd } from "@/components/ui";
import { FAVORITOS, PanelNav, SHORT } from "./nav";
import { SCREENS } from "./screens";
import { CommandPalette } from "./command-palette";
import { useHydrated } from "@/components/providers";
import { AiDrawer } from "./screens/datos";

export function BrandMark({ size = 28 }: { size?: number }) {
  const sector = useSector();
  return (
    <span className="grid shrink-0 place-items-center rounded-lg font-display font-bold text-white" style={{ width: size, height: size, background: sector.color, fontSize: size * 0.42 }}>
      {sector.empresaCorta.slice(0, 1)}
    </span>
  );
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme((document.documentElement.getAttribute("data-theme") as "light" | "dark") ?? "light");
  }, []);
  const toggle = useCallback(() => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("nexo-theme", next);
    } catch {}
    setTheme(next);
  }, []);
  return { theme, toggle };
}

export function PanelShell({ mode = "route", initialSection = "direccion", compact = false }: { mode?: "route" | "embedded"; initialSection?: string; compact?: boolean }) {
  const router = useRouter();
  const section = useUi((s) => s.panelSection);
  const setSection = useUi((s) => s.setPanelSection);
  const hydrated = useHydrated();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (mode === "route") setSection(initialSection);
  }, [mode, initialSection, setSection]);

  const go = useCallback(
    (id: string, focus?: string) => {
      setSection(id);
      if (focus) useUi.getState().setPanelFocus(focus);
      setMobileNav(false);
      if (mode === "route") router.push(`/panel/${id}`, { scroll: false });
    },
    [mode, router, setSection],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUi.getState().setCmdk(!useUi.getState().cmdk);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const Screen = SCREENS[section] ?? SCREENS.direccion;

  return (
    <PanelNav.Provider value={{ section, go, embedded: mode === "embedded" }}>
      <div className={cn("relative flex h-full min-h-0 w-full overflow-hidden bg-bg text-fg", mode === "route" && "h-dvh")}>
        <aside className={cn("hidden w-[232px] shrink-0 border-r border-line bg-surface lg:flex lg:flex-col", compact && "lg:hidden xl:flex")}>
          <Sidebar />
        </aside>
        <AnimatePresence>
          {mobileNav && (
            <div className="absolute inset-0 z-50 lg:hidden">
              <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)} />
              <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "spring", bounce: 0, duration: 0.35 }} className="absolute inset-y-0 left-0 flex w-[260px] flex-col border-r border-line bg-surface">
                <Sidebar />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileNav(true)} compact={compact} />
          <main className="relative min-h-0 flex-1 overflow-auto scroll-thin" id="panel-main">
            {hydrated ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="min-h-full">
                  <Screen />
                </motion.div>
              </AnimatePresence>
            ) : (
              <PanelSkeleton />
            )}
          </main>
        </div>
        <div id="panel-overlay" className="pointer-events-none absolute inset-0 z-40 [&>*]:pointer-events-auto" />
        <PanelToasts />
        <CommandPalette />
        <AiDrawer />
      </div>
    </PanelNav.Provider>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="skeleton h-7 w-56" />
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-72" />
    </div>
  );
}

function Sidebar() {
  const { section, go } = usePanelNavSafe();
  const sector = useSector();
  const avisosNuevos = useDemo((s) => s.avisos.filter((a) => a.estado === "nuevo").length);
  const borradores = useDemo((s) => s.invoices.filter((i) => i.estado === "borrador").length);
  const vacPend = useDemo((s) => s.absences.filter((a) => a.estado === "pendiente").length);
  const pendientes = useDemo((s) => s.jobs.filter((j) => j.estado === "pendiente").length);
  const showEstado = useUi((s) => s.showEstado);
  const activeGroup = MODULO_POR_ID[section]?.grupo;
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const hydrated = useHydrated();
  const counts: Record<string, number> = hydrated ? { "central-avisos": avisosNuevos, facturacion: borradores, vacaciones: vacPend, trabajos: pendientes } : {};

  const item = (id: string) => {
    const m = MODULO_POR_ID[id];
    const active = section === id;
    const label = id === "instalaciones" ? sector.instalacion.plural : SHORT[id];
    return (
      <button
        key={id}
        onClick={() => go(id)}
        data-tour={`nav-${id}`}
        className={cn(
          "group relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] transition-colors",
          active ? "bg-brand-soft font-medium text-brand" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
        )}
      >
        <Icon name={m.icono} className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {showEstado && m.estado === "a-medida" && <span className="rounded bg-ai-soft px-1 text-[10px] text-ai">a medida</span>}
        {!!counts[id] && (
          <motion.span key={counts[id]} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className={cn("tabular grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-semibold", id === "central-avisos" ? "bg-sun text-[#1d1300]" : "bg-surface-3 text-fg-2")}>
            {counts[id]}
          </motion.span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-3">
        <BrandMark />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-semibold">{sector.empresa}</div>
          <div className="truncate text-[11px] text-fg-3">Panel de oficina</div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-3 scroll-thin" aria-label="Módulos">
        <div className="space-y-0.5">{FAVORITOS.map(item)}</div>
        {(Object.keys(GRUPOS) as ModuleGroup[]).map((g) => {
          const isOpen = open[g] ?? g === activeGroup;
          const mods = MODULOS.filter((m) => m.grupo === g && !FAVORITOS.includes(m.id));
          return (
            <div key={g}>
              <button onClick={() => setOpen((o) => ({ ...o, [g]: !isOpen }))} className="flex h-7 w-full items-center gap-1 px-2 text-xs font-medium text-fg-3 hover:text-fg-2" aria-expanded={isOpen}>
                <span className="flex-1 text-left">{GRUPOS[g].nombre}</span>
                <span className="tabular text-[11px] opacity-70">{mods.length}</span>
                <ChevronDown className={cn("size-3.5 transition-transform", !isOpen && "-rotate-90")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-0.5 overflow-hidden">
                    {mods.map((m) => item(m.id))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <Avatar name="Marga Riera" color="#465661" size={26} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-medium">Marga Riera</div>
            <div className="text-[11px] text-fg-3">Oficina</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function usePanelNavSafe() {
  const section = useUi((s) => s.panelSection);
  const nav = useContextNav();
  return { section, go: nav.go };
}
function useContextNav() {
  return useContext(PanelNav);
}

function Topbar({ onMenu, compact }: { onMenu: () => void; compact?: boolean }) {
  const section = useUi((s) => s.panelSection);
  const m = MODULO_POR_ID[section];
  const sector = useSector();
  const { theme, toggle } = useTheme();
  const simulateCall = useDemo((s) => s.simulateCall);
  const simulateWhatsapp = useDemo((s) => s.simulateWhatsapp);
  const reset = useDemo((s) => s.reset);
  const setSector = useDemo((s) => s.setSector);
  const { go } = useContextNav();
  const [demoMenu, setDemoMenu] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface/80 px-3 backdrop-blur sm:px-4">
      <IconButton label="Abrir menú" onClick={onMenu} className={cn("lg:hidden", compact && "xl:hidden")}>
        <Menu className="size-4" />
      </IconButton>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className={cn("hidden text-fg-3", compact ? "2xl:inline" : "sm:inline")}>{m ? GRUPOS[m.grupo].nombre : ""}</span>
          <span className={cn("hidden text-fg-3", compact ? "2xl:inline" : "sm:inline")}>/</span>
          <span className="truncate font-medium">{section === "instalaciones" ? sector.instalacion.plural : SHORT[section]}</span>
        </div>
      </div>
      <button
        onClick={() => useUi.getState().setCmdk(true)}
        className="hidden h-8 w-56 items-center gap-2 rounded-lg border border-line bg-bg px-2.5 text-[13px] text-fg-3 transition hover:border-line-strong md:flex"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Buscar en todo</span>
        <Kbd>
          <Command className="size-3" />
        </Kbd>
        <Kbd>K</Kbd>
      </button>
      <IconButton label="Buscar" className="md:hidden" onClick={() => useUi.getState().setCmdk(true)}>
        <Search className="size-4" />
      </IconButton>
      <button onClick={() => useUi.getState().setAiOpen(true)} className="flex h-8 items-center gap-1.5 rounded-lg bg-ai-soft px-2.5 text-[13px] font-medium text-ai transition hover:brightness-95" data-tour="ai-button">
        <Sparkles className="size-3.5" />
        <span className="hidden sm:inline">Pregunta</span>
      </button>
      <div className="relative">
        <button
          onClick={() => setDemoMenu((v) => !v)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-2.5 text-[13px] text-fg-2 hover:bg-surface-2"
          aria-expanded={demoMenu}
          data-tour="demo-menu"
        >
          <Radio className="size-3.5 text-sun" />
          <span className="hidden sm:inline">Simular</span>
        </button>
        <AnimatePresence>
          {demoMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDemoMenu(false)} />
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 z-50 mt-1.5 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-e2">
                <div className="px-2 pt-1 pb-1.5 text-[11px] text-fg-3">Controles de la demo</div>
                <MenuItem icon={<PhoneIncoming className="size-4 text-sun" />} onClick={() => { simulateCall(); go("central-avisos"); setDemoMenu(false); }}>
                  Simular llamada entrante
                </MenuItem>
                <MenuItem icon={<MessageCircle className="size-4 text-ok" />} onClick={() => { simulateWhatsapp(); go("central-avisos"); setDemoMenu(false); }}>
                  Simular WhatsApp de cliente
                </MenuItem>
                <MenuItem icon={<RotateCcw className="size-4" />} onClick={() => { reset(); setDemoMenu(false); }}>
                  Reiniciar demo
                </MenuItem>
                <div className="my-1 border-t border-line" />
                <div className="px-2 pt-1 pb-1 text-[11px] text-fg-3">Sector</div>
                <div className="grid max-h-56 overflow-auto scroll-thin">
                  {SECTORES.map((s) => (
                    <MenuItem key={s.id} onClick={() => { setSector(s.id); setDemoMenu(false); }} icon={<span className="size-2.5 rounded-sm" style={{ background: s.color }} />}>
                      <span className={cn(s.id === sector.id && "font-semibold")}>{s.nombre}</span>
                    </MenuItem>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <Notifications />
      <IconButton label={theme === "dark" ? "Modo claro" : "Modo oscuro"} onClick={toggle}>
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </IconButton>
    </header>
  );
}

function MenuItem({ icon, children, onClick }: { icon?: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-surface-2">
      <span className="grid w-4 place-items-center">{icon}</span>
      {children}
    </button>
  );
}

function Notifications() {
  const notifs = useDemo((s) => s.notifs);
  const mark = useDemo((s) => s.markNotifsRead);
  const { go } = useContextNav();
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const list = useMemo(() => notifs.filter((n) => n.to === "panel").slice(0, 12), [notifs]);
  const unread = hydrated ? list.filter((n) => !n.leida).length : 0;
  return (
    <div className="relative">
      <IconButton label="Notificaciones" onClick={() => { setOpen((v) => !v); if (!open) setTimeout(() => mark("panel"), 1500); }} className="relative">
        <Bell className="size-4" />
        {unread > 0 && <span className="absolute top-1 right-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-bad px-0.5 text-[9px] font-bold text-white">{unread}</span>}
      </IconButton>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute right-0 z-50 mt-1.5 w-[340px] overflow-hidden rounded-xl border border-line bg-surface shadow-e2">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="text-[13px] font-semibold">Notificaciones</span>
                <button className="text-xs text-fg-3 hover:text-fg" onClick={() => mark("panel")}>Marcar como leídas</button>
              </div>
              <div className="max-h-96 overflow-auto scroll-thin">
                {list.map((n) => (
                  <button key={n.id} onClick={() => { if (n.href) go(n.href); setOpen(false); }} className="flex w-full gap-3 border-b border-line/60 px-3.5 py-2.5 text-left last:border-0 hover:bg-surface-2">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.leida ? "bg-transparent" : "bg-brand")} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium">{n.titulo}</span>
                      <span className="block text-xs text-fg-2">{n.texto}</span>
                      <span className="mt-0.5 block text-[11px] text-fg-3">{fmt.ago(n.ts)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PanelToasts() {
  const notifs = useDemo((s) => s.notifs);
  const hydrated = useHydrated();
  const { go } = useContextNav();
  const since = useRef(0);
  const [shown, setShown] = useState<string[]>([]);
  useEffect(() => {
    if (hydrated && !since.current) since.current = Date.now() - 500;
  }, [hydrated]);
  const toasts = notifs.filter((n) => n.to === "panel" && since.current && n.ts > since.current && !shown.includes(n.id)).slice(0, 3);
  useEffect(() => {
    if (!toasts.length) return;
    const ids = toasts.map((t) => t.id);
    const t = setTimeout(() => setShown((s) => [...s, ...ids]), 5200);
    return () => clearTimeout(t);
  }, [toasts]);
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 z-[60] flex w-[340px] max-w-[calc(100%-24px)] flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            className="pointer-events-auto flex gap-3 rounded-xl border border-line bg-surface p-3 shadow-e3"
          >
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", n.kind === "aviso" ? "bg-sun-soft text-sun" : n.kind === "pago" ? "bg-ok-soft text-ok" : n.kind === "equipo" ? "bg-info-soft text-info" : "bg-brand-soft text-brand")}>
              <Bell className="size-4" />
            </span>
            <button className="min-w-0 flex-1 text-left" onClick={() => n.href && go(n.href)}>
              <div className="text-[13px] font-semibold">{n.titulo}</div>
              <div className="line-clamp-2 text-xs text-fg-2">{n.texto}</div>
            </button>
            <button aria-label="Cerrar" className="self-start text-fg-3 hover:text-fg" onClick={() => setShown((s) => [...s, n.id])}>
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Cabecera de página ---------- */
export function PageHeader({ id, title, desc, actions, children }: { id?: string; title?: ReactNode; desc?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  const m = id ? MODULO_POR_ID[id] : undefined;
  const showEstado = useUi((s) => s.showEstado);
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
      <div className="min-w-0 max-w-2xl">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[22px] leading-tight font-semibold tracking-tight">{title ?? m?.nombre}</h1>
          {showEstado && m && <Badge tone={m.estado === "disponible" ? "ok" : "ai"}>{m.estado === "disponible" ? "Disponible" : "A medida"}</Badge>}
        </div>
        <p className="mt-1 text-[13px] text-fg-2">{desc ?? m?.descripcion}</p>
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PanelLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
