import { cn } from "@/lib/utils";

/** Marca Nexo4Pymes: dos nodos (oficina y campo) unidos. */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="h-full w-auto" aria-hidden>
        <rect width="32" height="32" rx="9" fill={light ? "#ffffff" : "var(--text)"} />
        <path d="M10 21.5 C 10 13, 22 19, 22 10.5" fill="none" stroke="#f5ab2e" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="10" cy="21.5" r="3.4" fill={light ? "#0a5d78" : "var(--brand)"} />
        <circle cx="22" cy="10.5" r="3.4" fill={light ? "#0a5d78" : "var(--brand)"} />
      </svg>
      <span className={cn("font-display text-[1.05em] font-semibold tracking-tight whitespace-nowrap", light ? "text-white" : "text-fg")} style={{ fontSize: "inherit" }}>
        Nexo<span className="text-sun">4</span>Pymes
      </span>
    </span>
  );
}
