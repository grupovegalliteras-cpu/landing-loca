"use client";

import { createContext, useContext } from "react";

export const SHORT: Record<string, string> = {
  "central-avisos": "Central Avisos",
  "asistente-atencion": "Asistente de atención",
  "web-reservas": "Web y reservas",
  recordatorios: "Avisos al cliente",
  resenas: "Reseñas",
  clientes: "Clientes",
  instalaciones: "Instalaciones",
  embudo: "Embudo comercial",
  presupuestos: "Presupuestos",
  contratos: "Contratos",
  "portal-cliente": "Portal del cliente",
  "multi-centro": "Multi-centro",
  planificacion: "Planificación",
  rutas: "Rutas",
  trabajos: "Órdenes de trabajo",
  informes: "Informes de servicio",
  almacen: "Almacén",
  flota: "Flota",
  incidencias: "Incidencias",
  facturacion: "Facturación",
  recurrente: "Facturación recurrente",
  cobros: "Cobros",
  impagos: "Impagos",
  gastos: "Gastos",
  contabilidad: "Contabilidad",
  rentabilidad: "Rentabilidad",
  fichaje: "Fichaje",
  turnos: "Turnos",
  vacaciones: "Vacaciones",
  "horas-extra": "Horas extra",
  nominas: "Nóminas y documentos",
  prevencion: "Prevención",
  comunicados: "Comunicados",
  chat: "Chat",
  direccion: "Panel de dirección",
  "asistente-ia": "Asistente IA",
  "informes-automaticos": "Informe semanal",
  automatizaciones: "Automatizaciones",
  conexiones: "Conexiones",
  seguridad: "Seguridad y permisos",
};

export const FAVORITOS = ["direccion", "central-avisos", "trabajos", "planificacion", "rutas", "facturacion", "fichaje"];

type Nav = { section: string; go: (id: string, focus?: string) => void; embedded: boolean };
export const PanelNav = createContext<Nav>({ section: "direccion", go: () => {}, embedded: false });
export const usePanelNav = () => useContext(PanelNav);
