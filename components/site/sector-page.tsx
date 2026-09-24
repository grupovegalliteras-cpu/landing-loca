"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, PhoneIncoming, PlayCircle, Smartphone } from "lucide-react";
import { useEffect } from "react";
import { SECTOR_POR_ID, SECTORES, type SectorId } from "@/data/sectors";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/components/providers";
import { fmt } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Caustics } from "./caustics";
import { SiteFooter, SiteNav } from "./chrome";
import { HeroAnim } from "./hero-anim";

export function SectorPage({ id }: { id: SectorId }) {
  const s = SECTOR_POR_ID[id];
  const hydrated = useHydrated();
  const current = useDemo((st) => st.sector);
  const setSector = useDemo((st) => st.setSector);
  useEffect(() => {
    if (hydrated && current !== id) setSector(id);
  }, [hydrated, current, id, setSector]);

  return (
    <div className="bg-bg text-fg">
      <SiteNav dark />
      <section className="relative overflow-hidden bg-[#041820] text-white">
        <div className="absolute inset-0">
          <Caustics />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(4_24_32/0.92),rgb(4_24_32/0.3))]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-28 pb-16 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[13px] text-white/75">
              <Icon name={s.icono} className="size-4" /> {s.nombre}
            </div>
            <h1 className="mt-5 font-display text-[40px] leading-[1.05] font-semibold tracking-tight sm:text-[56px]">
              Tu empresa de {s.nombre.toLowerCase()}, sin papeles ni llamadas perdidas
            </h1>
            <p className="mt-4 max-w-xl text-[17px] text-white/70">{s.dolor} Así lo resolvemos para empresas como la tuya.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/demo?sector=${s.id}&tour=1`} className="flex h-12 items-center gap-2 rounded-xl bg-sun px-5 text-[15px] font-semibold text-[#1d1300]">
                <PlayCircle className="size-5" /> Ver la demo de {s.empresa}
              </Link>
              <Link href="/#contacto" className="flex h-12 items-center rounded-xl border border-white/20 px-5 text-[15px] font-medium hover:bg-white/10">
                Pide la tuya
              </Link>
            </div>
          </div>
          <HeroAnim />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-sun">
              <PhoneIncoming className="size-4" /> Un aviso típico
            </div>
            <p className="mt-3 font-display text-[20px] leading-snug font-semibold">«{s.llamada.lineas.find((l) => l[0] === "cliente" && l[1].length > 40)?.[1]}»</p>
            <p className="mt-3 text-[14px] text-fg-2">{s.llamada.resumen}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-brand">
              <Smartphone className="size-4" /> El parte del técnico
            </div>
            <ul className="mt-3 grid gap-2 text-[14px]">
              {s.checklist.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <Check className="size-4 text-ok" /> {c}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }} className="rounded-2xl border border-line bg-surface p-6">
            <div className="text-[13px] font-semibold text-ai">Mediciones propias del sector</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {s.mediciones.map((m) => (
                <div key={m.nombre} className="rounded-xl bg-surface-2 p-3">
                  <div className="text-[12px] text-fg-3">{m.nombre}</div>
                  <div className="font-display text-lg font-semibold tabular">
                    {fmt.num(m.ok[0], m.dec)} a {fmt.num(m.ok[1], m.dec)} <span className="text-xs font-normal text-fg-3">{m.unidad}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <div className="text-[13px] font-semibold text-fg-2">Servicios y precios de ejemplo en la demo</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {s.servicios.map((x) => (
              <div key={x.nombre} className="rounded-xl bg-surface-2 p-3">
                <div className="text-[14px] font-medium">{x.nombre}</div>
                <div className="text-[13px] text-fg-3">
                  Desde {fmt.eur0(x.precio)}, {fmt.dur(x.min)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14">
          <div className="text-[13px] font-semibold text-fg-3">Otros sectores</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SECTORES.filter((x) => x.id !== s.id).map((x) => (
              <Link key={x.id} href={`/sectores/${x.id}`} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[14px] hover:bg-surface-2">
                <Icon name={x.icono} className="size-4 text-brand" /> {x.nombre}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
