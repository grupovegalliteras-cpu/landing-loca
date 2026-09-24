"use client";

import { useEffect, useRef } from "react";

/** Firma con el dedo. `demoKey` cambia para dibujar una firma de ejemplo animada. */
export function SignaturePad({ onInk, demoKey, clearKey }: { onInk: (has: boolean) => void; demoKey?: number; clearKey?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<[number, number] | null>(null);

  const ctx = () => {
    const c = ref.current;
    if (!c) return null;
    const x = c.getContext("2d");
    if (!x) return null;
    x.lineCap = "round";
    x.lineJoin = "round";
    x.lineWidth = 2.4;
    x.strokeStyle = getComputedStyle(c).color || "#0c1a22";
    return x;
  };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    c.getContext("2d")?.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    if (!clearKey) return;
    const c = ref.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    onInk(false);
  }, [clearKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!demoKey) return;
    const c = ref.current;
    const x = ctx();
    if (!c || !x) return;
    const w = c.getBoundingClientRect().width;
    const h = c.getBoundingClientRect().height;
    const pts: [number, number][] = [];
    for (let t = 0; t <= 1; t += 0.012) {
      const px = w * 0.12 + t * w * 0.72;
      const py = h * 0.55 + Math.sin(t * 18) * h * 0.18 * (1 - t * 0.4) - Math.sin(t * 5) * h * 0.08;
      pts.push([px, py]);
    }
    pts.push([w * 0.2, h * 0.78], [w * 0.8, h * 0.72]);
    let i = 1;
    let raf = 0;
    const step = () => {
      for (let k = 0; k < 3 && i < pts.length; k++, i++) {
        if (i === pts.length - 1) {
          x.beginPath();
          x.moveTo(...pts[i - 1]);
          x.lineTo(...pts[i]);
          x.stroke();
          continue;
        }
        x.beginPath();
        x.moveTo(...pts[i - 1]);
        x.lineTo(...pts[i]);
        x.stroke();
      }
      if (i < pts.length) raf = requestAnimationFrame(step);
      else onInk(true);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [demoKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  return (
    <canvas
      ref={ref}
      className="h-36 w-full touch-none rounded-2xl bg-surface text-fg"
      aria-label="Zona de firma del cliente"
      onPointerDown={(e) => {
        drawing.current = true;
        last.current = pos(e);
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drawing.current || !last.current) return;
        const x = ctx();
        const p = pos(e);
        if (!x) return;
        x.beginPath();
        x.moveTo(...last.current);
        x.lineTo(...p);
        x.stroke();
        last.current = p;
        onInk(true);
      }}
      onPointerUp={() => {
        drawing.current = false;
        last.current = null;
      }}
    />
  );
}
