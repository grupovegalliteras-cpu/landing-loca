"use client";

import { AnimatePresence, motion } from "motion/react";
import { CornerDownLeft, FileText, Search, User, Wrench } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MODULOS } from "@/data/modules";
import { useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { cn, fmt } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { usePanelNav, SHORT } from "./nav";

type Item = { id: string; group: string; label: string; sub?: string; icon: ReactNode; run: () => void };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function CommandPalette() {
  const open = useUi((s) => s.cmdk);
  const setOpen = useUi((s) => s.setCmdk);
  const { go } = usePanelNav();
  const clients = useDemo((s) => s.clients);
  const jobs = useDemo((s) => s.jobs);
  const invoices = useDemo((s) => s.invoices);
  const sector = useSector();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const n = norm(q.trim());
    const mods: Item[] = MODULOS.map((m) => ({
      id: `m-${m.id}`,
      group: "Módulos",
      label: m.id === "instalaciones" ? sector.instalacion.plural : SHORT[m.id],
      sub: m.nombre !== SHORT[m.id] ? m.nombre : undefined,
      icon: <Icon name={m.icono} className="size-4" />,
      run: () => go(m.id),
    }));
    const cl: Item[] = clients.map((c) => ({
      id: `c-${c.id}`,
      group: "Clientes",
      label: c.nombre,
      sub: `${c.municipio}, ${c.contacto}`,
      icon: <User className="size-4" />,
      run: () => go("clientes", c.id),
    }));
    const jb: Item[] = jobs
      .filter((j) => j.fecha >= fmtIso(-7))
      .map((j) => ({
        id: `j-${j.id}`,
        group: "Trabajos",
        label: `${j.codigo} ${j.titulo}`,
        sub: `${clients.find((c) => c.id === j.clientId)?.nombre ?? ""}, ${fmt.date(j.fecha)}`,
        icon: <Wrench className="size-4" />,
        run: () => go("trabajos", j.id),
      }));
    const inv: Item[] = invoices.slice(-60).map((i) => ({
      id: `f-${i.id}`,
      group: "Facturas",
      label: i.numero,
      sub: `${clients.find((c) => c.id === i.clientId)?.nombre ?? ""}, ${fmt.eur(i.total)}`,
      icon: <FileText className="size-4" />,
      run: () => go("facturacion", i.id),
    }));
    if (!n) return [...mods.slice(0, 8), ...cl.slice(0, 4)];
    const f = (it: Item) => norm(`${it.label} ${it.sub ?? ""}`).includes(n);
    return [...mods.filter(f).slice(0, 6), ...cl.filter(f).slice(0, 5), ...jb.filter(f).slice(0, 5), ...inv.filter(f).slice(0, 4)];
  }, [q, clients, jobs, invoices, go, sector]);

  const run = (it?: Item) => {
    if (!it) return;
    it.run();
    setOpen(false);
  };

  let lastGroup = "";
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal aria-label="Buscar en todo">
          <motion.div className="absolute inset-0 bg-[#04121a]/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-e3"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search className="size-4 text-fg-3" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIdx((i) => Math.min(items.length - 1, i + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIdx((i) => Math.max(0, i - 1));
                  } else if (e.key === "Enter") run(items[idx]);
                  else if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Busca un cliente, una factura, una orden o un módulo"
                className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-3"
                aria-label="Buscar"
              />
            </div>
            <div className="max-h-[50vh] overflow-auto p-1.5 scroll-thin">
              {items.length === 0 && <div className="px-3 py-10 text-center text-sm text-fg-3">Sin resultados para «{q}»</div>}
              {items.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.id}>
                    {header && <div className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-fg-3">{header}</div>}
                    <button
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => run(it)}
                      className={cn("flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left", i === idx ? "bg-brand-soft text-fg" : "text-fg-2")}
                    >
                      <span className={cn(i === idx ? "text-brand" : "text-fg-3")}>{it.icon}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">{it.label}</span>
                      {it.sub && <span className="max-w-[45%] truncate text-xs text-fg-3">{it.sub}</span>}
                      {i === idx && <CornerDownLeft className="size-3.5 text-fg-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function fmtIso(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
