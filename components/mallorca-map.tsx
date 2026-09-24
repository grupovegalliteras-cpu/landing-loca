"use client";

import { motion } from "motion/react";
import { useId, useMemo, type ReactNode } from "react";
import { cn, initials } from "@/lib/utils";

/** Costa de Mallorca simplificada (lon, lat), en sentido horario desde Formentor. */
const COAST: [number, number][] = [
  [3.213, 39.962], [3.19, 39.95], [3.15, 39.935], [3.12, 39.925], [3.09, 39.91], [3.075, 39.9], [3.085, 39.885], [3.12, 39.875],
  [3.17, 39.885], [3.2, 39.885], [3.16, 39.865], [3.14, 39.855], [3.125, 39.835], [3.11, 39.81], [3.105, 39.79], [3.13, 39.765],
  [3.17, 39.755], [3.22, 39.74], [3.27, 39.745], [3.33, 39.745], [3.37, 39.73], [3.42, 39.74], [3.455, 39.755], [3.47, 39.72],
  [3.48, 39.695], [3.455, 39.665], [3.42, 39.635], [3.39, 39.6], [3.37, 39.575], [3.34, 39.545], [3.31, 39.5], [3.28, 39.455],
  [3.265, 39.42], [3.24, 39.39], [3.22, 39.36], [3.19, 39.335], [3.14, 39.31], [3.09, 39.285], [3.05, 39.265], [3.01, 39.29],
  [2.98, 39.32], [2.95, 39.355], [2.9, 39.365], [2.84, 39.36], [2.79, 39.365], [2.765, 39.4], [2.75, 39.45], [2.735, 39.5],
  [2.7, 39.53], [2.665, 39.552], [2.625, 39.545], [2.595, 39.53], [2.57, 39.515], [2.545, 39.49], [2.525, 39.46], [2.515, 39.49],
  [2.495, 39.512], [2.47, 39.5], [2.45, 39.515], [2.42, 39.53], [2.39, 39.535], [2.36, 39.55], [2.345, 39.575], [2.37, 39.6],
  [2.42, 39.625], [2.47, 39.645], [2.51, 39.685], [2.56, 39.715], [2.61, 39.74], [2.66, 39.765], [2.69, 39.795], [2.73, 39.815],
  [2.79, 39.845], [2.85, 39.87], [2.92, 39.885], [2.98, 39.9], [3.04, 39.915], [3.08, 39.93], [3.12, 39.945], [3.17, 39.955],
];

/** Sierra de Tramuntana, sombreado aproximado */
const SIERRA: [number, number][] = [
  [2.38, 39.59], [2.46, 39.63], [2.55, 39.69], [2.66, 39.745], [2.76, 39.8], [2.88, 39.85], [2.98, 39.875], [3.05, 39.88],
  [3.02, 39.84], [2.92, 39.8], [2.82, 39.75], [2.7, 39.7], [2.58, 39.64], [2.48, 39.6],
];

const TOWNS: [string, number, number][] = [
  ["Palma", 2.6502, 39.5696], ["Calvià", 2.5062, 39.5657], ["Marratxí", 2.7514, 39.6219], ["Inca", 2.911, 39.721],
  ["Manacor", 3.2096, 39.5696], ["Alcúdia", 3.105, 39.845], ["Sóller", 2.715, 39.7667], ["Llucmajor", 2.8906, 39.4903],
];

const W = 1000;
const H = 790;
export function project(lat: number, lon: number): [number, number] {
  return [(lon - 2.3) * 833.7, (39.98 - lat) * 1082];
}

function smoothPath(pts: [number, number][], closed = true) {
  const p = pts.map(([lon, lat]) => project(lat, lon));
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + (closed ? "Z" : "");
}

const COAST_D = smoothPath(COAST);
const SIERRA_D = smoothPath(SIERRA);

export type MapMarker = {
  id: string;
  lat: number;
  lon: number;
  kind: "job" | "tech" | "base" | "client";
  color?: string;
  label?: string;
  n?: number;
  active?: boolean;
  done?: boolean;
  pulse?: boolean;
};

export type MapRoute = { id: string; points: { lat: number; lon: number }[]; color: string; dashed?: boolean; width?: number; opacity?: number };

function routeD(points: { lat: number; lon: number }[]) {
  if (points.length < 2) return "";
  const p = points.map((x) => project(x.lat, x.lon));
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const off = 0.12;
    d += ` Q${mx - dy * off},${my + dx * off} ${x1},${y1}`;
  }
  return d;
}

export function MallorcaMap({
  markers = [],
  routes = [],
  fit,
  className,
  onMarkerClick,
  showTowns = true,
  children,
}: {
  markers?: MapMarker[];
  routes?: MapRoute[];
  fit?: { lat: number; lon: number }[];
  className?: string;
  onMarkerClick?: (id: string) => void;
  showTowns?: boolean;
  children?: ReactNode;
}) {
  const gid = useId().replace(/:/g, "");
  const vb = useMemo(() => {
    if (!fit || fit.length < 2) return { x: 0, y: 0, w: W, h: H };
    const pts = fit.map((f) => project(f.lat, f.lon));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 70;
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    let w = Math.max(x1 - x0, 360);
    let h = Math.max(y1 - y0, 280);
    const ratio = W / H;
    if (w / h > ratio) h = w / ratio;
    else w = h * ratio;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { x: Math.max(-50, cx - w / 2), y: Math.max(-50, cy - h / 2), w, h };
  }, [fit]);
  const k = vb.w / W; // escala para mantener el tamaño de los marcadores

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        animate={{ viewBox: `${vb.x} ${vb.y} ${vb.w} ${vb.h}` } as never}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="size-full"
        role="img"
        aria-label="Mapa de Mallorca con las paradas y técnicos"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`sea-${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--map-sea-1, #d6e9f0)" />
            <stop offset="1" stopColor="var(--map-sea-2, #c3dde8)" />
          </linearGradient>
          <pattern id={`dots-${gid}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--map-dot, rgba(10,93,120,0.10))" />
          </pattern>
          <filter id={`sh-${gid}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0a3a4d" floodOpacity="0.18" />
          </filter>
        </defs>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={`url(#sea-${gid})`} />
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={`url(#dots-${gid})`} />
        <path d={COAST_D} fill="none" stroke="var(--map-coast-glow, rgba(255,255,255,0.55))" strokeWidth={14 * k} strokeLinejoin="round" />
        <path d={COAST_D} fill="var(--map-land, #f7f8f5)" stroke="var(--map-coast, #9dbfcc)" strokeWidth={1.4 * k} filter={`url(#sh-${gid})`} />
        <path d={SIERRA_D} fill="var(--map-sierra, rgba(61,122,50,0.10))" />
        {showTowns &&
          TOWNS.map(([n, lon, lat]) => {
            const [x, y] = project(lat, lon);
            return (
              <g key={n} opacity={0.75}>
                <circle cx={x} cy={y} r={2.5 * k} fill="var(--map-town, #7a8893)" />
                <text x={x + 6 * k} y={y + 4 * k} fontSize={13 * k} fill="var(--map-town, #7a8893)" fontWeight={500} style={{ fontFamily: "var(--font-geist)" }}>
                  {n}
                </text>
              </g>
            );
          })}
        {routes.map((r) => (
          <g key={r.id}>
            <motion.path
              d={routeD(r.points)}
              fill="none"
              stroke={r.color}
              strokeWidth={(r.width ?? 3.5) * k}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={r.dashed ? `${6 * k} ${7 * k}` : undefined}
              opacity={r.opacity ?? 0.9}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.3, ease: "easeInOut" }}
            />
          </g>
        ))}
        {markers.map((m) => {
          const [x, y] = project(m.lat, m.lon);
          const s = k;
          if (m.kind === "base")
            return (
              <g key={m.id} transform={`translate(${x},${y}) scale(${s})`}>
                <rect x={-9} y={-9} width={18} height={18} rx={4} fill="var(--text)" />
                <path d="M-4,3 L-4,-1 L0,-4 L4,-1 L4,3 Z" fill="var(--bg)" />
              </g>
            );
          if (m.kind === "tech")
            return (
              <g key={m.id} transform={`translate(${x},${y}) scale(${s})`} className={onMarkerClick ? "cursor-pointer" : undefined} onClick={() => onMarkerClick?.(m.id)}>
                {m.pulse && (
                  <circle r={14} fill={m.color} opacity={0.35}>
                    <animate attributeName="r" values="12;26" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.45;0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={14} fill={m.color} stroke="var(--surface)" strokeWidth={3} />
                <text textAnchor="middle" y={4.5} fontSize={11} fontWeight={700} fill="#fff" style={{ fontFamily: "var(--font-geist)" }}>
                  {initials(m.label ?? "")}
                </text>
              </g>
            );
          return (
            <g key={m.id} transform={`translate(${x},${y}) scale(${s})`} className={onMarkerClick ? "cursor-pointer" : undefined} onClick={() => onMarkerClick?.(m.id)}>
              {m.active && (
                <circle r={12} fill={m.color ?? "var(--brand)"} opacity={0.3}>
                  <animate attributeName="r" values="11;22" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <path d="M0,0 C-7,-9 -11,-13 -11,-19 A11,11 0 1 1 11,-19 C11,-13 7,-9 0,0Z" fill={m.done ? "var(--surface)" : (m.color ?? "var(--brand)")} stroke={m.color ?? "var(--brand)"} strokeWidth={2} />
              <text textAnchor="middle" y={-15} fontSize={10.5} fontWeight={700} fill={m.done ? (m.color ?? "var(--brand)") : "#fff"} style={{ fontFamily: "var(--font-geist)" }}>
                {m.n ?? "•"}
              </text>
              {m.label && m.kind === "client" && (
                <text x={14} y={-14} fontSize={11} fill="var(--text-2)" fontWeight={500} style={{ fontFamily: "var(--font-geist)" }}>
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </motion.svg>
      {children}
    </div>
  );
}
