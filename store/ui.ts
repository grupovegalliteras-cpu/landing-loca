"use client";

import { create } from "zustand";

export type AppScreen =
  | "hoy" | "ruta" | "trabajo" | "parte" | "qr" | "fichar" | "gasto" | "docs" | "nominas" | "vacaciones"
  | "turnos" | "comunicados" | "chat" | "notificaciones" | "incidencia" | "mas";

export type AppRoute = { screen: AppScreen; params?: Record<string, string> };

type Emit = { name: string; payload?: string; ts: number };

type UiState = {
  panelSection: string;
  setPanelSection: (s: string) => void;
  panelFocus?: string; // id que el panel debe abrir (drawer)
  setPanelFocus: (id?: string) => void;

  appStack: AppRoute[];
  appDir: 1 | -1;
  appPush: (r: AppRoute) => void;
  appBack: () => void;
  appReset: (r?: AppRoute) => void;

  cmdk: boolean;
  setCmdk: (v: boolean) => void;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;

  showEstado: boolean;
  offline: boolean;
  setOffline: (v: boolean) => void;

  spotlight: string | null;
  setSpotlight: (s: string | null) => void;

  /** eventos puntuales que las pantallas escuchan (tour y piloto automático) */
  event: Emit | null;
  emit: (name: string, payload?: string) => void;
};

export const useUi = create<UiState>()((set) => ({
  panelSection: "direccion",
  setPanelSection: (panelSection) => set({ panelSection, panelFocus: undefined }),
  panelFocus: undefined,
  setPanelFocus: (panelFocus) => set({ panelFocus }),

  appStack: [{ screen: "hoy" }],
  appDir: 1,
  appPush: (r) => set((s) => ({ appStack: [...s.appStack, r], appDir: 1 })),
  appBack: () => set((s) => ({ appStack: s.appStack.length > 1 ? s.appStack.slice(0, -1) : s.appStack, appDir: -1 })),
  appReset: (r = { screen: "hoy" }) => set({ appStack: [r], appDir: -1 }),

  cmdk: false,
  setCmdk: (cmdk) => set({ cmdk }),
  aiOpen: false,
  setAiOpen: (aiOpen) => set({ aiOpen }),

  showEstado: false,
  offline: false,
  setOffline: (offline) => set({ offline }),

  spotlight: null,
  setSpotlight: (spotlight) => set({ spotlight }),

  event: null,
  emit: (name, payload) => set({ event: { name, payload, ts: Date.now() } }),
}));
