/* eslint-disable @next/next/no-img-element -- piezas pequeñas y ya optimizadas en public/brand */
import { cn } from "@/lib/utils";

/**
 * Logo real de Nexo4Pymes, extraído del original con scripts/logo.mjs.
 * `light`: sobre fondo oscuro (blanco y menta). Sin él, se adapta al tema claro u oscuro.
 * La altura la marca `className` (h-7…); el nombre va en un span para poder ocultarlo.
 */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  const pieza = (base: string, cls?: string) =>
    light ? (
      <img src={`/brand/${base}-oscuro.png`} alt="" className={cls} />
    ) : (
      <>
        <img src={`/brand/${base}-claro.png`} alt="" className={cn(cls, "dark:hidden")} />
        <img src={`/brand/${base}-oscuro.png`} alt="" className={cn(cls, "hidden dark:block")} />
      </>
    );
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="img" aria-label="Nexo4Pymes">
      {pieza("marca", "h-full w-auto")}
      <span className="flex h-[62%] items-center">{pieza("nombre", "h-full w-auto")}</span>
    </span>
  );
}
