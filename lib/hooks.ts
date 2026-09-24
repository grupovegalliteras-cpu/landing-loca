"use client";

import { useEffect, useMemo, useState } from "react";
import { useDemo } from "@/store/demo";
import type { Client, Tech } from "@/data/types";
import { haversineKm, isoDay } from "./utils";
import { BASE } from "@/data/seed";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useMaps() {
  const clients = useDemo((s) => s.clients);
  const techs = useDemo((s) => s.techs);
  const installations = useDemo((s) => s.installations);
  return useMemo(
    () => ({
      client: Object.fromEntries(clients.map((c) => [c.id, c])) as Record<string, Client>,
      tech: Object.fromEntries(techs.map((t) => [t.id, t])) as Record<string, Tech>,
      inst: Object.fromEntries(installations.map((i) => [i.id, i])),
    }),
    [clients, techs, installations],
  );
}

/** Devuelve true si el id cambió hace poco (para resaltar filas). */
export function useFlash(id: string) {
  const lc = useDemo((s) => s.lastChange);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (lc && lc.ids.includes(id) && Date.now() - lc.ts < 2500) {
      setOn(true);
      const t = setTimeout(() => setOn(false), 2300);
      return () => clearTimeout(t);
    }
  }, [lc, id]);
  return on;
}

export const today = () => isoDay(new Date());

/** Km por carretera aproximados entre puntos (factor de sinuosidad 1,3). */
export function routeKm(points: { lat: number; lon: number }[]) {
  let km = 0;
  for (let i = 1; i < points.length; i++) km += haversineKm(points[i - 1], points[i]) * 1.3;
  return km;
}
export const kmToMin = (km: number) => Math.round((km / 48) * 60);

/** Vecino más cercano desde la nave */
export function optimizeOrder<T extends { lat: number; lon: number }>(stops: T[], start = BASE): T[] {
  const rest = [...stops];
  const out: T[] = [];
  let cur: { lat: number; lon: number } = start;
  while (rest.length) {
    let bi = 0;
    let bd = Infinity;
    rest.forEach((s, i) => {
      const d = haversineKm(cur, s);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    cur = rest[bi];
    out.push(rest.splice(bi, 1)[0]);
  }
  return out;
}
