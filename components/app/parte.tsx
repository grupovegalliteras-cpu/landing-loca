"use client";

import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, CloudUpload, FileCheck2, Minus, PenLine, Plus, Receipt, RotateCcw, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDemo, useSector } from "@/store/demo";
import { useUi } from "@/store/ui";
import { useMaps, useNow } from "@/lib/hooks";
import { cn, fmt } from "@/lib/utils";
import { FakePhoto } from "@/components/photo";
import { SignaturePad } from "./signature-pad";
import { AppHeader } from "./screens";

function Section({ n, title, ok, children }: { n: number; title: string; ok?: boolean; children: React.ReactNode }) {
  return (
    <section className="px-4">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <span className={cn("grid size-5 place-items-center rounded-full text-[11px] font-bold", ok ? "bg-ok text-white" : "bg-surface-3 text-fg-2")}>{ok ? <Check className="size-3" /> : n}</span>
        <h2 className="text-[14px] font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function Parte({ params }: { params: Record<string, string> }) {
  const job = useDemo((s) => s.jobs.find((j) => j.id === params.id));
  const stock = useDemo((s) => s.stock);
  const complete = useDemo((s) => s.completeJob);
  const sector = useSector();
  const maps = useMaps();
  const offline = useUi((s) => s.offline);
  const event = useUi((s) => s.event);
  const reset = useUi((s) => s.appReset);
  const now = useNow(1000);
  const c = job ? maps.client[job.clientId] : undefined;

  const [check, setCheck] = useState<boolean[]>(() => sector.checklist.map(() => false));
  const [med, setMed] = useState<Record<string, number>>(() => Object.fromEntries(sector.mediciones.map((m) => [m.nombre, NaN])));
  const [mat, setMat] = useState<Record<string, number>>({});
  const [fotos, setFotos] = useState<{ id: string; after: boolean }[]>([]);
  const [ink, setInk] = useState(false);
  const [firmante, setFirmante] = useState(c?.contacto ?? "");
  const [demoSig, setDemoSig] = useState(0);
  const [clearSig, setClearSig] = useState(0);
  const [state, setState] = useState<"edit" | "queued" | "sent">("edit");
  const bottom = useRef<HTMLDivElement>(null);
  const handled = useRef(useUi.getState().event?.ts ?? 0);

  const done = check.filter(Boolean).length;
  const canSubmit = done === check.length && ink && fotos.length > 0;

  const submit = () => {
    if (!job) return;
    if (useUi.getState().offline) {
      setState("queued");
      return;
    }
    complete(job.id, {
      checklistHecho: check,
      mediciones: Object.fromEntries(Object.entries(med).map(([k, v]) => [k, isNaN(v) ? (sector.mediciones.find((m) => m.nombre === k)!.ok[0] + sector.mediciones.find((m) => m.nombre === k)!.ok[1]) / 2 : v])),
      material: Object.entries(mat).map(([itemId, cantidad]) => ({ itemId, cantidad })),
      fotos: fotos.length,
      firmadoPor: firmante || c?.contacto || "Cliente",
    });
    setState("sent");
  };

  // vuelve la cobertura: se sincroniza solo
  useEffect(() => {
    if (!offline && state === "queued") {
      const t = setTimeout(submit, 900);
      return () => clearTimeout(t);
    }
  }, [offline, state]); // eslint-disable-line react-hooks/exhaustive-deps

  // piloto automático para el recorrido guiado
  useEffect(() => {
    if (!event || event.ts === handled.current) return;
    handled.current = event.ts;
    if (event.name === "parte:autofill") {
      const timers: ReturnType<typeof setTimeout>[] = [];
      sector.checklist.forEach((_, i) => timers.push(setTimeout(() => setCheck((c0) => c0.map((v, k) => (k === i ? true : v))), 250 + i * 260)));
      const t0 = 250 + sector.checklist.length * 260;
      timers.push(
        setTimeout(() => {
          setMed(Object.fromEntries(sector.mediciones.map((m) => [m.nombre, Number(((m.ok[0] + m.ok[1]) / 2 + (m.ok[1] - m.ok[0]) * 0.1).toFixed(m.dec))])));
          const firstMat = stock.slice(0, 2);
          setMat(Object.fromEntries(firstMat.map((s, i) => [s.id, i ? 1 : 2])));
        }, t0),
      );
      timers.push(setTimeout(() => setFotos([{ id: "a", after: false }]), t0 + 500));
      timers.push(setTimeout(() => setFotos([{ id: "a", after: false }, { id: "b", after: true }]), t0 + 950));
      timers.push(
        setTimeout(() => {
          bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          setDemoSig((d) => d + 1);
        }, t0 + 1300),
      );
      return () => timers.forEach(clearTimeout);
    }
    if (event.name === "parte:submit") submit();
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!job || !c) return <AppHeader title="Parte no disponible" />;

  if (state !== "edit")
    return (
      <div className="grid min-h-full place-items-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="grid w-full place-items-center gap-4 text-center">
          {state === "queued" ? (
            <>
              <span className="grid size-20 place-items-center rounded-full bg-warn-soft text-warn">
                <WifiOff className="size-9" />
              </span>
              <div className="font-display text-[22px] font-semibold">Guardado en el móvil</div>
              <p className="text-[15px] text-fg-2">No hay cobertura. El parte, las fotos y la firma se enviarán solos en cuanto vuelva la señal.</p>
              <div className="flex items-center gap-2 text-[13px] text-fg-3">
                <CloudUpload className="size-4 animate-pulse" /> Pendiente de enviar
              </div>
            </>
          ) : (
            <>
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="grid size-20 place-items-center rounded-full bg-ok text-white">
                <Check className="size-10" />
              </motion.span>
              <div className="font-display text-[24px] font-semibold">Parte cerrado</div>
              <div className="grid w-full gap-2 text-left">
                {[
                  [FileCheck2, `Informe con fotos y firma enviado a ${c.nombre}`],
                  [Receipt, "Factura preparada en la oficina"],
                  [Check, "Material descontado de tu furgoneta"],
                ].map(([I, t], i) => {
                  const Icon = I as typeof Check;
                  return (
                    <motion.div key={String(t)} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }} className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-[14px] shadow-e1">
                      <Icon className="size-5 text-ok" /> {String(t)}
                    </motion.div>
                  );
                })}
              </div>
              <button onClick={() => reset({ screen: "hoy" })} className="mt-2 h-[52px] w-full rounded-2xl bg-brand text-[16px] font-semibold text-brand-ink">
                Volver a mi día
              </button>
            </>
          )}
        </motion.div>
      </div>
    );

  return (
    <div className="pb-8">
      <AppHeader title="Parte de trabajo" sub={`${c.nombre}, ${job.codigo}`} />
      <div className="sticky top-[76px] z-10 mx-4 mb-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div className="h-full bg-ok" animate={{ width: `${((done / check.length) * 0.6 + (fotos.length ? 0.15 : 0) + (ink ? 0.25 : 0)) * 100}%` }} />
      </div>
      <div className="grid gap-5">
        <Section n={1} title="Checklist" ok={done === check.length}>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-e1">
            {sector.checklist.map((item, i) => (
              <button key={item} onClick={() => setCheck((c0) => c0.map((v, k) => (k === i ? !v : v)))} className="flex w-full items-center gap-3 border-b border-line/70 px-3.5 py-3 text-left last:border-0">
                <motion.span animate={{ scale: check[i] ? [1, 1.25, 1] : 1 }} className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors", check[i] ? "border-ok bg-ok text-white" : "border-line-strong")}>
                  {check[i] && <Check className="size-3.5" />}
                </motion.span>
                <span className={cn("text-[15px]", check[i] && "text-fg-3")}>{item}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section n={2} title="Mediciones" ok={Object.values(med).every((v) => !isNaN(v))}>
          <div className="grid grid-cols-2 gap-2">
            {sector.mediciones.map((m) => {
              const v = med[m.nombre];
              const has = !isNaN(v);
              const ok = has && v >= m.ok[0] && v <= m.ok[1];
              return (
                <label key={m.nombre} className={cn("rounded-2xl bg-surface p-3 shadow-e1 ring-2 ring-transparent transition", has && (ok ? "ring-ok/40" : "ring-bad/50"))}>
                  <span className="block text-[12px] text-fg-3">{m.nombre}</span>
                  <span className="mt-1 flex items-baseline gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      step={1 / Math.pow(10, m.dec)}
                      value={has ? v : ""}
                      onChange={(e) => setMed((x) => ({ ...x, [m.nombre]: e.target.value === "" ? NaN : Number(e.target.value) }))}
                      placeholder={fmt.num((m.ok[0] + m.ok[1]) / 2, m.dec)}
                      className="w-full min-w-0 bg-transparent font-display text-[22px] font-semibold tabular outline-none placeholder:text-fg-3/40"
                    />
                    <span className="text-[13px] text-fg-3">{m.unidad}</span>
                  </span>
                  <span className={cn("block text-[11px]", !has ? "text-fg-3" : ok ? "text-ok" : "text-bad")}>
                    {!has ? `Entre ${fmt.num(m.ok[0], m.dec)} y ${fmt.num(m.ok[1], m.dec)}` : ok ? "Correcto" : "Fuera de rango"}
                  </span>
                </label>
              );
            })}
          </div>
        </Section>

        <Section n={3} title="Material de tu furgoneta" ok={Object.values(mat).some((v) => v > 0)}>
          <div className="overflow-hidden rounded-2xl bg-surface shadow-e1">
            {stock.slice(0, 5).map((s) => {
              const q = mat[s.id] ?? 0;
              const disp = s.furgonetas[job.techId ?? ""] ?? 0;
              return (
                <div key={s.id} className="flex items-center gap-3 border-b border-line/70 px-3.5 py-2.5 last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px]">{s.nombre}</span>
                    <span className="block text-[12px] text-fg-3">
                      Te quedan {disp - q} {s.unidad}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <button onClick={() => setMat((x) => ({ ...x, [s.id]: Math.max(0, q - 1) }))} className="grid size-8 place-items-center rounded-full bg-surface-2" aria-label="Quitar">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-5 text-center text-[16px] font-semibold tabular">{q}</span>
                    <button onClick={() => setMat((x) => ({ ...x, [s.id]: Math.min(disp, q + 1) }))} className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand" aria-label="Añadir">
                      <Plus className="size-4" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section n={4} title="Fotos antes y después" ok={fotos.length >= 2}>
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence>
              {fotos.map((f) => (
                <motion.div key={f.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                  <FakePhoto seed={job.id + f.id} after={f.after} label={f.after ? "Después" : "Antes"} stamp={fmt.time(now)} tint={sector.color} className="aspect-square" />
                  {!f.after && (
                    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full">
                      <motion.ellipse cx="55" cy="62" rx="22" ry="15" fill="none" stroke="#f5ab2e" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
                    </svg>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {fotos.length < 6 && (
              <button onClick={() => setFotos((f) => [...f, { id: String(f.length), after: f.length > 0 }])} className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-line-strong text-brand">
                <span className="grid place-items-center gap-1 text-[12px] font-medium">
                  <Camera className="size-6" />
                  {fotos.length === 0 ? "Antes" : "Después"}
                </span>
              </button>
            )}
          </div>
          {fotos.length > 0 && <p className="mt-1.5 px-1 text-[12px] text-fg-3">Puedes marcar sobre la foto lo que has reparado.</p>}
        </Section>

        <Section n={5} title="Horas" ok>
          <div className="flex items-center justify-between rounded-2xl bg-surface p-3.5 shadow-e1">
            <span className="text-[14px] text-fg-2">Desde que empezaste</span>
            <span className="font-display text-[20px] font-semibold tabular">{job.inicio ? fmt.clock(now - job.inicio) : fmt.dur(job.duracionMin)}</span>
          </div>
        </Section>

        <Section n={6} title="Firma del cliente" ok={ink}>
          <div className="rounded-2xl bg-surface p-2 shadow-e1">
            <div className="relative">
              <SignaturePad onInk={setInk} demoKey={demoSig} clearKey={clearSig} />
              {!ink && (
                <span className="pointer-events-none absolute inset-0 grid place-items-center text-[14px] text-fg-3">
                  <span className="flex items-center gap-1.5">
                    <PenLine className="size-4" /> Firma aquí con el dedo
                  </span>
                </span>
              )}
              <span className="pointer-events-none absolute right-6 bottom-8 left-6 border-b border-dashed border-line-strong" />
            </div>
            <div className="flex items-center gap-2 px-1.5 pt-2">
              <input value={firmante} onChange={(e) => setFirmante(e.target.value)} className="h-9 flex-1 rounded-lg bg-surface-2 px-3 text-[14px] outline-none" aria-label="Nombre de quien firma" />
              <button onClick={() => setClearSig((k) => k + 1)} className="grid size-9 place-items-center rounded-lg bg-surface-2 text-fg-2" aria-label="Borrar firma">
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>
        </Section>

        <div className="px-4" ref={bottom}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={submit} disabled={!canSubmit} className="flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-ok text-[17px] font-semibold text-white shadow-e2 disabled:bg-surface-3 disabled:text-fg-3 disabled:shadow-none" data-tour="app-cerrar-parte">
            <Check className="size-5" /> Cerrar parte y enviar informe
          </motion.button>
          {!canSubmit && <p className="mt-2 text-center text-[12px] text-fg-3">Completa la checklist, añade una foto y pide la firma.</p>}
        </div>
      </div>
    </div>
  );
}
