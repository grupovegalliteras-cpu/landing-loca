"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn, initials } from "@/lib/utils";
import type { InvoiceStatus, JobStatus } from "@/data/types";

/* ---------- Botones ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "sun" | "ai";
  size?: "xs" | "sm" | "md" | "lg";
};
export function Button({ variant = "secondary", size = "md", className, children, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background,box-shadow,color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "xs" && "h-7 rounded-md px-2 text-xs",
        size === "sm" && "h-8 rounded-lg px-2.5 text-[13px]",
        size === "md" && "h-9 rounded-lg px-3.5 text-sm",
        size === "lg" && "h-12 rounded-xl px-5 text-[15px]",
        variant === "primary" && "bg-brand text-brand-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-brand-strong",
        variant === "secondary" && "border border-line bg-surface text-fg shadow-e1 hover:bg-surface-2",
        variant === "ghost" && "text-fg-2 hover:bg-surface-2 hover:text-fg",
        variant === "danger" && "bg-bad text-white hover:opacity-90",
        variant === "sun" && "bg-sun text-[#1d1300] hover:brightness-105",
        variant === "ai" && "bg-ai text-white hover:opacity-90",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...p}
      aria-label={label}
      title={label}
      className={cn("inline-grid size-8 place-items-center rounded-lg text-fg-2 transition hover:bg-surface-2 hover:text-fg", className)}
    >
      {children}
    </button>
  );
}

/* ---------- Badges ---------- */
export type Tone = "neutral" | "brand" | "ok" | "warn" | "bad" | "ai" | "info" | "sun";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-2",
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  ai: "bg-ai-soft text-ai",
  info: "bg-info-soft text-info",
  sun: "bg-sun-soft text-sun",
};
export function Badge({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 text-xs font-medium", TONE[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const JOB_STATUS: Record<JobStatus, { label: string; tone: Tone }> = {
  pendiente: { label: "Pendiente", tone: "neutral" },
  asignado: { label: "Asignado", tone: "info" },
  "en-camino": { label: "En camino", tone: "sun" },
  "en-curso": { label: "En curso", tone: "brand" },
  finalizado: { label: "Finalizado", tone: "ok" },
  facturado: { label: "Facturado", tone: "ai" },
};
export function JobStatusBadge({ s }: { s: JobStatus }) {
  const v = JOB_STATUS[s];
  return (
    <Badge tone={v.tone} dot>
      {v.label}
    </Badge>
  );
}
export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  emitida: { label: "Pendiente de cobro", tone: "info" },
  cobrada: { label: "Cobrada", tone: "ok" },
  vencida: { label: "Vencida", tone: "bad" },
};
export function InvoiceStatusBadge({ s }: { s: InvoiceStatus }) {
  const v = INVOICE_STATUS[s];
  return (
    <Badge tone={v.tone} dot>
      {v.label}
    </Badge>
  );
}
export function UrgencyBadge({ u }: { u: "alta" | "media" | "baja" }) {
  return <Badge tone={u === "alta" ? "bad" : u === "media" ? "warn" : "neutral"}>{u === "alta" ? "Urgente" : u === "media" ? "Media" : "Baja"}</Badge>;
}

/* ---------- Avatar ---------- */
export function Avatar({ name, color, size = 28, ring }: { name: string; color?: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", ring && "ring-2 ring-surface")}
      style={{ width: size, height: size, background: color ?? "var(--brand)", fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/* ---------- Tarjetas ---------- */
export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...p} className={cn("rounded-xl border border-line bg-surface", className)}>
      {children}
    </div>
  );
}
export function CardHeader({ title, sub, right, className }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-3.5 pb-2", className)}>
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold text-fg">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-fg-3">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-grid h-5 min-w-5 place-items-center rounded border border-line bg-surface-2 px-1 font-sans text-[11px] text-fg-3">{children}</kbd>;
}

/* ---------- Número animado ---------- */
export function AnimatedNumber({ value, format = (n: number) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (reduce || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    const dur = 900;
    let raf = 0;
    setBump((b) => b + 1);
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      setShown(a + (value - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return (
    <motion.span key={bump} className={cn("tabular", className)} initial={bump ? { color: "var(--sun)" } : false} animate={{ color: "inherit" }} transition={{ duration: 1.4 }}>
      {format(shown)}
    </motion.span>
  );
}

/* ---------- Segmentado ---------- */
export function Segmented<T extends string>({ value, onChange, options, size = "sm" }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; size?: "sm" | "xs" }) {
  return (
    <div className="inline-flex rounded-lg bg-surface-2 p-0.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative rounded-md px-2.5 font-medium transition-colors",
            size === "sm" ? "h-7 text-[13px]" : "h-6 text-xs",
            value === o.value ? "text-fg" : "text-fg-3 hover:text-fg-2",
          )}
        >
          {value === o.value && <motion.span layoutId={`seg-${options.map((x) => x.value).join("")}`} className="absolute inset-0 rounded-md bg-surface shadow-e1" transition={{ type: "spring", bounce: 0.15, duration: 0.35 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Capa superpuesta del panel (para que en /demo no tape la app) ---------- */
export function Overlay({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setEl(document.getElementById("panel-overlay") ?? document.body);
  }, []);
  if (!el) return null;
  return createPortal(children, el);
}

/* ---------- Modal y panel lateral ---------- */
export function Modal({ open, onClose, children, className, label }: { open: boolean; onClose: () => void; children: ReactNode; className?: string; label: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <Overlay>
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[80] grid place-items-center p-4 [body>&]:fixed" role="dialog" aria-modal aria-label={label}>
          <motion.div className="absolute inset-0 bg-[#04121a]/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.4 }}
            className={cn("relative max-h-[90dvh] w-full max-w-lg overflow-auto rounded-2xl border border-line bg-surface shadow-e3 scroll-thin", className)}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </Overlay>
  );
}

export function Drawer({ open, onClose, children, title, width = 520 }: { open: boolean; onClose: () => void; children: ReactNode; title: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <Overlay>
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex justify-end [body>&]:fixed" role="dialog" aria-modal>
          <motion.div className="absolute inset-0 bg-[#04121a]/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            className="relative flex h-full w-full flex-col border-l border-line bg-surface shadow-e3"
            style={{ maxWidth: width }}
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
              <div className="min-w-0 truncate text-sm font-semibold">{title}</div>
              <IconButton label="Cerrar" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-auto scroll-thin">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
    </Overlay>
  );
}

/* ---------- Tabla de datos ---------- */
export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sort?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  hideSm?: boolean;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  search,
  filters,
  pageSize = 12,
  onRowClick,
  flashIds,
  flashTs,
  toolbar,
  empty = "No hay nada que mostrar con estos filtros.",
  defaultSort,
  placeholder = "Buscar",
  dense,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  search?: (r: T) => string;
  filters?: { label: string; fn: (r: T) => boolean }[];
  pageSize?: number;
  onRowClick?: (r: T) => void;
  flashIds?: string[];
  flashTs?: number;
  toolbar?: ReactNode;
  empty?: ReactNode;
  defaultSort?: { key: string; dir: 1 | -1 };
  placeholder?: string;
  dense?: boolean;
}) {
  const [q, setQ] = useState("");
  const [f, setF] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | undefined>(defaultSort);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (filters && filters[f]) out = out.filter(filters[f].fn);
    if (q && search) {
      const n = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      out = out.filter((r) => search(r).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(n));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sort) {
        const s = col.sort;
        out = [...out].sort((a, b) => {
          const va = s(a);
          const vb = s(b);
          return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
        });
      }
    }
    return out;
  }, [rows, filters, f, q, search, sort, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(page, pages - 1);
  const slice = filtered.slice(p * pageSize, p * pageSize + pageSize);
  const flashing = flashTs && Date.now() - flashTs < 3000 ? new Set(flashIds) : null;

  return (
    <div className="flex min-w-0 flex-col">
      {(search || filters || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          {search && (
            <label className="relative flex h-8 min-w-[180px] flex-1 items-center sm:max-w-[260px]">
              <Search className="pointer-events-none absolute left-2.5 size-3.5 text-fg-3" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-full w-full rounded-lg border border-line bg-bg pl-8 pr-2 text-[13px] outline-none placeholder:text-fg-3 focus:border-brand"
              />
            </label>
          )}
          {filters && (
            <div className="flex flex-wrap gap-1">
              {filters.map((fl, i) => {
                const count = rows.filter(fl.fn).length;
                return (
                  <button
                    key={fl.label}
                    onClick={() => {
                      setF(i);
                      setPage(0);
                    }}
                    className={cn(
                      "h-7 rounded-md px-2 text-xs font-medium transition",
                      f === i ? "bg-fg text-bg" : "text-fg-2 hover:bg-surface-2",
                    )}
                  >
                    {fl.label} <span className={cn("tabular ml-0.5", f === i ? "opacity-70" : "text-fg-3")}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">{toolbar}</div>
        </div>
      )}
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-3">
              {columns.map((c) => (
                <th key={c.key} className={cn("h-9 px-3 font-medium", c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideSm && "max-md:hidden", c.className)}>
                  {c.sort ? (
                    <button
                      className={cn("inline-flex items-center gap-1 hover:text-fg", sort?.key === c.key && "text-fg")}
                      onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: -1 }))}
                    >
                      {c.header}
                      <ArrowUpDown className="size-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: Math.min(6, pageSize) }).map((_, i) => (
                  <tr key={i} className="border-b border-line/70">
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-3", dense ? "h-9" : "h-11", c.hideSm && "max-md:hidden")}>
                        <div className="skeleton h-3" style={{ width: `${40 + ((i * 17 + c.key.length * 11) % 50)}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              : slice.map((r) => {
                  const k = rowKey(r);
                  const fl = flashing?.has(k);
                  return (
                    <tr
                      key={fl ? `${k}-${flashTs}` : k}
                      onClick={onRowClick ? () => onRowClick(r) : undefined}
                      className={cn("border-b border-line/70 transition-colors last:border-0", onRowClick && "cursor-pointer hover:bg-surface-2/70", fl && "row-flash")}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={cn("px-3", dense ? "h-9" : "h-11", c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideSm && "max-md:hidden", c.className)}>
                          {c.cell(r)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!loading && !slice.length && <div className="grid place-items-center px-4 py-14 text-center text-sm text-fg-3">{empty}</div>}
      </div>
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs text-fg-3">
          <span className="tabular">
            {p * pageSize + 1}–{Math.min(filtered.length, (p + 1) * pageSize)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <IconButton label="Página anterior" className="size-7" onClick={() => setPage(Math.max(0, p - 1))} disabled={p === 0}>
              <ChevronLeft className="size-4" />
            </IconButton>
            <span className="tabular px-1">
              {p + 1} / {pages}
            </span>
            <IconButton label="Página siguiente" className="size-7" onClick={() => setPage(Math.min(pages - 1, p + 1))} disabled={p >= pages - 1}>
              <ChevronRight className="size-4" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Varios ---------- */
export function Stat({ label, value, sub, tone, children }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: Tone; children?: ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3.5">
      <div className="text-xs text-fg-3">{label}</div>
      <div className="mt-1 font-display text-[26px] leading-none font-semibold tracking-tight text-fg">{value}</div>
      {sub && <div className={cn("mt-1.5 text-xs", tone ? `text-${tone}` : "text-fg-3")}>{sub}</div>}
      {children}
    </div>
  );
}

export function Progress({ value, tone = "brand", className }: { value: number; tone?: Tone; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-surface-2", className)}>
      <motion.div className={cn("h-full rounded-full", `bg-${tone === "neutral" ? "fg-3" : tone}`)} initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} />
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 px-6 py-12 text-center">
      {icon && <div className="grid size-10 place-items-center rounded-xl bg-surface-2 text-fg-3">{icon}</div>}
      <div className="text-sm font-medium">{title}</div>
      {text && <p className="max-w-xs text-xs text-fg-3">{text}</p>}
      {action}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-fg-2">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-fg-3">{hint}</span>}
    </label>
  );
}

export const inputCls = "h-9 w-full rounded-lg border border-line bg-bg px-2.5 text-sm outline-none focus:border-brand";
