import { hashString, cn } from "@/lib/utils";

/** "Foto" generada: una escena abstracta que evoca una foto de obra, con sello de cámara. */
export function FakePhoto({ seed, label, stamp, tint = "#0a5d78", className, after }: { seed: string; label?: string; stamp?: string; tint?: string; className?: string; after?: boolean }) {
  const h = hashString(seed);
  const a = (h % 360) / 360;
  const r = (n: number) => ((h >> n) & 255) / 255;
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-surface-3", className)} role="img" aria-label={label ?? "Foto del trabajo"}>
      <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <filter id={`b${h}`}>
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id={`l${h}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={after ? "#dfe9ee" : "#b9c2c6"} />
            <stop offset="1" stopColor={after ? "#9fb5bf" : "#6f7b80"} />
          </linearGradient>
        </defs>
        <rect width="160" height="120" fill={`url(#l${h})`} />
        <g filter={`url(#b${h})`} opacity={0.9}>
          <rect x={10 + r(1) * 40} y={50 + r(3) * 20} width={70 + r(5) * 40} height={60} rx={6} fill={after ? "#f4f6f7" : "#8c979c"} />
          <circle cx={30 + r(7) * 100} cy={30 + r(9) * 30} r={18 + r(11) * 14} fill={tint} opacity={after ? 0.55 : 0.25} />
          <rect x={90 + r(13) * 40} y={10} width={16} height={90} fill={after ? "#ffffff" : "#5b666b"} opacity={0.6} />
          {!after && <circle cx={60 + r(15) * 60} cy={85 + r(17) * 15} r={14} fill="#4a3f2c" opacity={0.35 + a * 0.2} />}
        </g>
        <rect width="160" height="120" fill={after ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"} />
      </svg>
      {label && <span className="absolute top-1.5 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">{label}</span>}
      {stamp && <span className="tabular absolute right-1.5 bottom-1.5 text-[9px] font-medium text-white/90 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">{stamp}</span>}
    </div>
  );
}

export function Signature({ name, className }: { name: string; className?: string }) {
  const h = hashString(name);
  const pts = Array.from({ length: 7 }, (_, i) => [10 + i * 22, 30 + ((h >> (i * 3)) % 24) - 12]);
  const d = `M${pts[0][0]},${pts[0][1]} ` + pts.slice(1).map((p, i) => `Q${p[0] - 11},${(i % 2 ? 8 : 52)} ${p[0]},${p[1]}`).join(" ") + ` M20,48 L150,${40 + (h % 10)}`;
  return (
    <svg viewBox="0 0 170 60" className={cn("h-14 w-40 text-fg", className)} aria-label={`Firma de ${name}`} role="img">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
