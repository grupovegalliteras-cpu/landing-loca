"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GRUPOS, MODULOS, type ModuleGroup } from "@/data/modules";
import { SECTOR_POR_ID, type SectorId } from "@/data/sectors";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { SiteFooter, SiteNav } from "./chrome";

export function Servicios() {
  const [q, setQ] = useState("");
  const showEstado = useUi((s) => s.showEstado);
  const n = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const list = useMemo(() => MODULOS.filter((m) => !n || `${m.nombre} ${m.descripcion}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(n)), [n]);
  return (
    <div className="bg-bg text-fg">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6">
        <h1 className="font-display text-[40px] leading-tight font-semibold tracking-tight sm:text-[52px]">Catálogo de servicios</h1>
        <p className="mt-3 max-w-2xl text-[17px] text-fg-2">Todo lo que podemos montar para tu empresa. Empiezas por un módulo y vas sumando. Cada uno se puede probar en la demo.</p>
        <label className="relative mt-8 flex max-w-md items-center">
          <Search className="pointer-events-none absolute left-3.5 size-4 text-fg-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca: fichaje, factura, WhatsApp…" className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[15px] outline-none focus:border-brand" aria-label="Buscar servicio" />
        </label>
        <div className="mt-12 grid gap-14">
          {(Object.keys(GRUPOS) as ModuleGroup[]).map((g) => {
            const mods = list.filter((m) => m.grupo === g);
            if (!mods.length) return null;
            return (
              <section key={g}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                  <h2 className="font-display text-[26px] font-semibold tracking-tight">{GRUPOS[g].nombre}</h2>
                  <span className="text-[14px] text-fg-3">{GRUPOS[g].lema}</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mods.map((m, i) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.05 }}>
                      <Link href={`/panel/${m.id}`} className={cn("group flex h-full flex-col rounded-2xl border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-e2", m.destacado ? "border-brand/30" : "border-line")}>
                        <div className="flex items-center justify-between">
                          <span className={cn("grid size-10 place-items-center rounded-xl", m.id === "central-avisos" ? "bg-sun text-[#1d1300]" : "bg-brand-soft text-brand")}>
                            <Icon name={m.icono} className="size-5" />
                          </span>
                          {showEstado && <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", m.estado === "disponible" ? "bg-ok-soft text-ok" : "bg-ai-soft text-ai")}>{m.estado === "disponible" ? "Disponible" : "A medida"}</span>}
                        </div>
                        <div className="mt-4 text-[16px] font-semibold">{m.nombre}</div>
                        <p className="mt-1 flex-1 text-[14px] leading-relaxed text-fg-2">{m.descripcion}</p>
                        {m.sectores !== "todos" && <div className="mt-3 text-[12px] text-fg-3">Pensado para: {(m.sectores as SectorId[]).map((s) => SECTOR_POR_ID[s]?.nombre.toLowerCase()).join(", ")}</div>}
                        <div className="mt-4 text-[13px] font-medium text-brand">Verlo en la demo</div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
          {!list.length && <div className="py-16 text-center text-fg-3">No hay servicios que coincidan con «{q}».</div>}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
