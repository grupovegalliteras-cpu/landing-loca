"use client";

import { MotionConfig } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { startSync, useDemo } from "@/store/demo";
import { useUi } from "@/store/ui";
import { createSeed, DATA_VERSION } from "@/data/seed";
import { isSectorId } from "@/data/sectors";
import { isoDay } from "@/lib/utils";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("estado") === "1") useUi.setState({ showEstado: true });
    Promise.resolve(useDemo.persist.rehydrate()).finally(() => {
      const s = useDemo.getState();
      const sec = params.get("sector");
      const today = isoDay(new Date());
      if (s.version !== DATA_VERSION || s.hoy !== today || !s.techs?.length) {
        useDemo.setState(createSeed(isSectorId(sec) ? sec : isSectorId(s.sector) ? s.sector : "mantenimiento"));
      } else if (isSectorId(sec) && sec !== s.sector) {
        s.setSector(sec);
      }
      useDemo.getState().setHydrated();
      startSync();
    });
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function useHydrated() {
  return useDemo((s) => s.hydrated);
}
