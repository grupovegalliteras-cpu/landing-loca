"use client";

import { motion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Pt = { x: string; y: number; y2?: number };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}

export function AreaChart({
  data,
  height = 220,
  format = (n: number) => String(Math.round(n)),
  color = "var(--brand)",
  color2 = "var(--sun)",
  label2,
  label,
  xLabel = (s: string) => s,
}: {
  data: Pt[];
  height?: number;
  format?: (n: number) => string;
  color?: string;
  color2?: string;
  label?: string;
  label2?: string;
  xLabel?: (s: string) => string;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = height;
  const pl = 44, pr = 12, pt = 12, pb = 26;
  const max = niceMax(Math.max(...data.map((d) => Math.max(d.y, d.y2 ?? 0)), 1));
  const xs = (i: number) => pl + (i / Math.max(1, data.length - 1)) * (W - pl - pr);
  const ys = (v: number) => pt + (1 - v / max) * (H - pt - pb);
  const line = (key: "y" | "y2") =>
    data
      .map((d, i) => {
        const v = key === "y" ? d.y : (d.y2 ?? 0);
        return `${i ? "L" : "M"}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`;
      })
      .join(" ");
  const area = `${line("y")} L${xs(data.length - 1)},${H - pb} L${xs(0)},${H - pb} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * max);
  const every = Math.ceil(data.length / 7);
  const has2 = data.some((d) => d.y2 !== undefined);

  return (
    <div className="relative">
      {(label || label2) && (
        <div className="mb-2 flex gap-4 px-1 text-xs text-fg-3">
          {label && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded" style={{ background: color }} />
              {label}
            </span>
          )}
          {label2 && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded border-t border-dashed" style={{ borderColor: color2 }} />
              {label2}
            </span>
          )}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} onMouseLeave={() => setHover(null)} role="img" aria-label={label}>
        <defs>
          <linearGradient id={`g-${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pl} x2={W - pr} y1={ys(t)} y2={ys(t)} stroke="var(--border)" strokeDasharray={t ? "2 4" : undefined} />
            <text x={pl - 8} y={ys(t) + 4} textAnchor="end" fontSize="10.5" fill="var(--text-3)" className="tabular">
              {format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % every === 0 ? (
            <text key={i} x={xs(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-3)">
              {xLabel(d.x)}
            </text>
          ) : null,
        )}
        <motion.path d={area} fill={`url(#g-${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={line("y")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeOut" }} />
        {has2 && <path d={line("y2")} fill="none" stroke={color2} strokeWidth="1.6" strokeDasharray="4 4" />}
        {data.map((_, i) => (
          <rect key={i} x={xs(i) - (W - pl - pr) / data.length / 2} y={pt} width={(W - pl - pr) / data.length} height={H - pt - pb} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={xs(hover)} x2={xs(hover)} y1={pt} y2={H - pb} stroke="var(--border-strong)" />
            <circle cx={xs(hover)} cy={ys(data[hover].y)} r="4.5" fill="var(--surface)" stroke={color} strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-6 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-e2"
          style={{ left: `clamp(0px, calc(${(xs(hover) / W) * 100}% - 60px), calc(100% - 140px))` }}
        >
          <div className="text-fg-3">{xLabel(data[hover].x)}</div>
          <div className="tabular font-semibold">{format(data[hover].y)}</div>
          {data[hover].y2 !== undefined && <div className="tabular text-fg-2">{label2}: {format(data[hover].y2!)}</div>}
        </div>
      )}
    </div>
  );
}

export function BarChart({ data, height = 180, format = (n: number) => String(Math.round(n)), colors }: { data: { label: string; value: number }[]; height?: number; format?: (n: number) => string; colors?: string[] }) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  return (
    <div className="flex items-end gap-2" style={{ height }} role="img" aria-label="Gráfico de barras">
      {data.map((d, i) => (
        <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="tabular text-[11px] font-medium text-fg-2">{format(d.value)}</span>
          <motion.div
            className="w-full max-w-12 rounded-md"
            style={{ background: colors?.[i] ?? "var(--brand)" }}
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * (height - 44)}px` }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
          />
          <span className="w-full truncate text-center text-[11px] text-fg-3">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({ data, format = (n: number) => String(Math.round(n)), color = "var(--brand)", sub }: { data: { label: string; value: number; extra?: string; color?: string }[]; format?: (n: number) => string; color?: string; sub?: (d: { label: string; value: number }) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13px]">{d.label}</span>
          <span className="tabular text-[13px] font-medium">{format(d.value)}</span>
          <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div className="h-full rounded-full" style={{ background: d.color ?? color }} initial={{ width: 0 }} animate={{ width: `${(d.value / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.04 }} />
          </div>
          {(d.extra || sub) && <span className="col-span-2 -mt-0.5 text-[11px] text-fg-3">{d.extra ?? sub?.(d)}</span>}
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 132, thickness = 16, center }: { parts: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offsets = parts.reduce<number[]>((acc, p, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + parts[i - 1].value);
    return acc;
  }, []);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Gráfico circular">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {parts.map((p, i) => {
          const len = (p.value / total) * c;
          return (
            <motion.circle
              key={p.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
              strokeDashoffset={-(offsets[i] / total) * c}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            />
          );
        })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

export function Sparkline({ values, color = "var(--brand)", className }: { values: number[]; color?: string; className?: string }) {
  const d = useMemo(() => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    return values.map((v, i) => `${i ? "L" : "M"}${(i / Math.max(1, values.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 26}`).join(" ");
  }, [values]);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-24", className)} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
