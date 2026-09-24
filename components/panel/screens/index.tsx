import type { ComponentType } from "react";
import { Direccion } from "./direccion";
import { Avisos } from "./avisos";
import { Trabajos } from "./trabajos";
import { Planificacion } from "./planificacion";
import { Rutas } from "./rutas";
import { Clientes, Instalaciones, MultiCentro, PortalCliente } from "./clientes";
import { Cobros, Contabilidad, Facturacion, Gastos, Impagos, Recurrente, Rentabilidad } from "./finanzas";
import { Chat, Comunicados, Fichaje, HorasExtra, Nominas, Prevencion, Turnos, Vacaciones } from "./equipo";
import { Contratos, Embudo, Presupuestos } from "./ventas";
import { Almacen, Flota, Incidencias, Informes } from "./operaciones";
import { AsistenteAtencion, Recordatorios, Resenas, WebReservas } from "./captacion";
import { AsistenteIA, Automatizaciones, Conexiones, InformesAutomaticos, Seguridad } from "./datos";

export const SCREENS: Record<string, ComponentType> = {
  direccion: Direccion,
  "central-avisos": Avisos,
  "asistente-atencion": AsistenteAtencion,
  "web-reservas": WebReservas,
  recordatorios: Recordatorios,
  resenas: Resenas,
  clientes: Clientes,
  instalaciones: Instalaciones,
  embudo: Embudo,
  presupuestos: Presupuestos,
  contratos: Contratos,
  "portal-cliente": PortalCliente,
  "multi-centro": MultiCentro,
  planificacion: Planificacion,
  rutas: Rutas,
  trabajos: Trabajos,
  informes: Informes,
  almacen: Almacen,
  flota: Flota,
  incidencias: Incidencias,
  facturacion: Facturacion,
  recurrente: Recurrente,
  cobros: Cobros,
  impagos: Impagos,
  gastos: Gastos,
  contabilidad: Contabilidad,
  rentabilidad: Rentabilidad,
  fichaje: Fichaje,
  turnos: Turnos,
  vacaciones: Vacaciones,
  "horas-extra": HorasExtra,
  nominas: Nominas,
  prevencion: Prevencion,
  comunicados: Comunicados,
  chat: Chat,
  "asistente-ia": AsistenteIA,
  "informes-automaticos": InformesAutomaticos,
  automatizaciones: Automatizaciones,
  conexiones: Conexiones,
  seguridad: Seguridad,
};
