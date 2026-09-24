"use client";

import { AnimatePresence, motion } from "motion/react";
import { BatteryFull, Bell, CalendarCheck, Clock, Home, Map, Menu, MessageCircle, Signal, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDemo } from "@/store/demo";
import { useUi, type AppRoute, type AppScreen } from "@/store/ui";
import { useHydrated } from "@/components/providers";
import { useNow } from "@/lib/hooks";
import { cn, fmt } from "@/lib/utils";
import { APP_SCREENS } from "./screens";

const TABS: { screen: AppScreen; label: string; icon: typeof Home }[] = [
  { screen: "hoy", label: "Hoy", icon: Home },
  { screen: "ruta", label: "Ruta", icon: Map },
  { screen: "fichar", label: "Fichar", icon: Clock },
  { screen: "chat", label: "Oficina", icon: MessageCircle },
  { screen: "mas", label: "Más", icon: Menu },
];

export function PhoneFrame({ children, className, scale = 1 }: { children: ReactNode; className?: string; scale?: number }) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: 390 * scale, height: 820 * scale }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: 390, height: 820, transform: `scale(${scale})` }}>
        <div className="relative h-full w-full rounded-[54px] bg-[#0b1115] p-[11px] shadow-[0_40px_80px_-30px_rgb(4_18_26/0.55),inset_0_0_0_1.5px_rgb(255_255_255/0.08),0_0_0_1px_rgb(0_0_0/0.4)]">
          <span className="absolute top-[120px] -left-[3px] h-9 w-[3px] rounded-l bg-[#1a2328]" />
          <span className="absolute top-[176px] -left-[3px] h-14 w-[3px] rounded-l bg-[#1a2328]" />
          <span className="absolute top-[150px] -right-[3px] h-20 w-[3px] rounded-r bg-[#1a2328]" />
          <div className="relative h-full w-full overflow-hidden rounded-[44px] bg-bg">{children}</div>
          <span className="pointer-events-none absolute top-[22px] left-1/2 z-50 h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ framed = true }: { framed?: boolean }) {
  const hydrated = useHydrated();
  const stack = useUi((s) => s.appStack);
  const dir = useUi((s) => s.appDir);
  const reset = useUi((s) => s.appReset);
  const offline = useUi((s) => s.offline);
  const top = stack[stack.length - 1];
  const Screen = APP_SCREENS[top.screen];
  const now = useNow(15000);
  const notifs = useDemo((s) => s.notifs);
  const unread = hydrated ? notifs.filter((n) => n.to === "app" && !n.leida).length : 0;

  return (
    <div className={cn("relative flex h-full w-full flex-col overflow-hidden bg-bg text-fg", !framed && "h-dvh")}>
      {/* barra de estado */}
      <div className={cn("relative z-40 flex h-[50px] shrink-0 items-end justify-between px-7 pb-1.5 text-[13px] font-semibold", !framed && "h-[max(12px,env(safe-area-inset-top))] items-center pb-0 opacity-0")}>
        <span className="tabular" suppressHydrationWarning>{hydrated ? fmt.time(now) : ""}</span>
        <span className="flex items-center gap-1.5">
          <Signal className={cn("size-3.5", offline && "opacity-30")} />
          {offline ? <WifiOff className="size-3.5 text-bad" /> : <Wifi className="size-3.5" />}
          <BatteryFull className="size-4" />
        </span>
      </div>
      <AnimatePresence>
        {offline && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="relative z-30 overflow-hidden bg-[#3a2a0d] text-[#f5ab2e]">
            <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium">
              <WifiOff className="size-3.5" /> Sin cobertura. Todo se guarda en el móvil y se envía al volver.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative min-h-0 flex-1">
        {hydrated ? (
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={`${top.screen}-${JSON.stringify(top.params ?? {})}-${stack.length}`}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? "100%" : "-28%", opacity: d > 0 ? 1 : 0.6 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d > 0 ? "-28%" : "100%", opacity: d > 0 ? 0.6 : 1, zIndex: d > 0 ? 0 : 2 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", bounce: 0, duration: 0.42 }}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-bg no-scrollbar"
              style={{ zIndex: 1 }}
            >
              <Screen params={top.params ?? {}} />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="space-y-3 p-4">
            <div className="skeleton h-8 w-40" />
            <div className="skeleton h-28" />
            <div className="skeleton h-20" />
          </div>
        )}
        <AppBanner />
      </div>
      {/* barra de pestañas */}
      <nav className="relative z-30 grid shrink-0 grid-cols-5 border-t border-line bg-surface/95 px-2 pt-1.5 pb-[max(18px,env(safe-area-inset-bottom))] backdrop-blur" aria-label="Navegación de la app">
        {TABS.map((t) => {
          const active = stack[0].screen === t.screen && stack.length === 1 ? true : stack[0].screen === t.screen;
          return (
            <button key={t.screen} onClick={() => reset({ screen: t.screen })} className={cn("relative flex flex-col items-center gap-0.5 py-1 text-[10.5px] font-medium", active ? "text-brand" : "text-fg-3")} data-tour={`app-tab-${t.screen}`}>
              <t.icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
              {t.label}
              {t.screen === "hoy" && unread > 0 && <span className="absolute top-0.5 right-[calc(50%-18px)] grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">{unread}</span>}
            </button>
          );
        })}
      </nav>
      {framed && <span className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-[5px] w-32 -translate-x-1/2 rounded-full bg-fg/80" />}
    </div>
  );
}

function AppBanner() {
  const notifs = useDemo((s) => s.notifs);
  const hydrated = useHydrated();
  const push = useUi((s) => s.appPush);
  const since = useRef(0);
  const [cur, setCur] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => {
    if (hydrated && !since.current) since.current = Date.now() - 500;
  }, [hydrated]);
  const next = notifs.find((n) => n.to === "app" && since.current && n.ts > since.current && !seen.includes(n.id));
  useEffect(() => {
    if (!next) return;
    setCur(next.id);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(40);
      } catch {}
    }
    const t = setTimeout(() => {
      setSeen((s) => [...s, next.id]);
      setCur(null);
    }, 4800);
    return () => clearTimeout(t);
  }, [next?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = notifs.find((x) => x.id === cur);
  const open = () => {
    if (!n) return;
    setSeen((s) => [...s, n.id]);
    setCur(null);
    const r: AppRoute = n.href?.startsWith("j") ? { screen: "trabajo", params: { id: n.href } } : n.href === "vacaciones" ? { screen: "vacaciones" } : n.href === "nominas" ? { screen: "docs" } : n.href === "comunicados" ? { screen: "comunicados" } : n.href === "chat" ? { screen: "chat" } : { screen: "notificaciones" };
    push(r);
  };
  return (
    <AnimatePresence>
      {n && (
        <motion.button
          key={n.id}
          initial={{ y: -90, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.55 }}
          onClick={open}
          className="absolute top-2 right-2.5 left-2.5 z-40 flex items-start gap-3 rounded-[22px] border border-white/10 bg-[#1b2a33]/95 p-3 text-left text-white shadow-e3 backdrop-blur-xl"
          data-tour="app-banner"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand">
            {n.kind === "trabajo" ? <Bell className="size-4.5" /> : n.kind === "equipo" ? <CalendarCheck className="size-4.5" /> : <MessageCircle className="size-4.5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between text-[11px] text-white/60">
              <span>Nexo Campo</span>
              <span>ahora</span>
            </span>
            <span className="block text-[14px] font-semibold">{n.titulo}</span>
            <span className="line-clamp-2 block text-[13px] text-white/80">{n.texto}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
