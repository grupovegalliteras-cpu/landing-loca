"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSeed, computeInvoice, huellaVerifactu, DATA_VERSION, MUNICIPIOS } from "@/data/seed";
import { SECTOR_POR_ID, SECTOR_DEFECTO, type SectorId } from "@/data/sectors";
import type { Absence, Aviso, DemoData, Invoice, Job, JobStatus, Notif, Opportunity } from "@/data/types";
import { isoDay, uid } from "@/lib/utils";

type CompletePayload = {
  checklistHecho: boolean[];
  mediciones: Record<string, number>;
  material: { itemId: string; cantidad: number }[];
  fotos: number;
  firmadoPor: string;
};

type Actions = {
  hydrated: boolean;
  setHydrated: () => void;
  setSector: (s: SectorId) => void;
  reset: () => void;
  simulateCall: () => string;
  simulateWhatsapp: () => string;
  convertAviso: (avisoId: string, techId: string, opts?: { fecha?: string; hora?: string }) => string | undefined;
  discardAviso: (avisoId: string) => void;
  assignJob: (jobId: string, techId: string | undefined, fecha?: string, hora?: string) => void;
  clockIn: (techId: string) => void;
  togglePause: (techId: string) => void;
  clockOut: (techId: string) => void;
  setJobStatus: (jobId: string, estado: JobStatus) => void;
  completeJob: (jobId: string, p: CompletePayload) => string | undefined;
  issueInvoice: (invoiceId: string) => void;
  payInvoice: (invoiceId: string, metodo?: Invoice["metodo"]) => void;
  sendReminder: (invoiceId: string) => void;
  rectify: (invoiceId: string) => void;
  addWebRequest: (nombre: string, telefono: string, texto: string, canal?: "web" | "whatsapp", lectura?: Partial<Pick<Aviso, "tipo" | "urgencia" | "servicio" | "resumen">>) => string;
  addClient: (c: { nombre: string; municipio: string; contacto: string; telefono: string; tipo: string }) => string;
  requestAbsence: (techId: string, desde: string, hasta: string, tipo?: Absence["tipo"]) => string;
  resolveAbsence: (id: string, ok: boolean) => void;
  markPayslipRead: (id: string) => void;
  uploadPayslips: () => void;
  readComunicado: (id: string, techId: string) => void;
  sendComunicado: (titulo: string, texto: string) => void;
  sendChat: (techId: string, from: "oficina" | "tecnico", texto: string, jobId?: string) => void;
  addExpense: (techId: string, proveedor: string, categoria: string, base: number) => void;
  createIncidencia: (clientId: string, titulo: string, jobId?: string) => void;
  markNotifsRead: (to: Notif["to"]) => void;
  moveOpportunity: (id: string, etapa: Opportunity["etapa"]) => void;
  signContract: (id: string) => void;
  acceptQuote: (id: string) => void;
  sendQuote: (id: string) => void;
};

export type DemoState = DemoData & Actions;

const DATA_KEYS: (keyof DemoData)[] = [
  "version", "sector", "semilla", "hoy", "techs", "clients", "installations", "avisos", "jobs", "invoices", "stock",
  "vehicles", "contracts", "quotes", "opportunities", "expenses", "absences", "payslips", "comunicados",
  "timeEntries", "incidencias", "chats", "notifs", "activity", "counters", "meId", "lastChange",
];

export function pickData(s: DemoState): DemoData {
  const out: Record<string, unknown> = {};
  for (const k of DATA_KEYS) out[k] = s[k];
  return out as DemoData;
}

function notif(to: Notif["to"], titulo: string, texto: string, kind: Notif["kind"], href?: string): Notif {
  return { id: uid("nt"), to, titulo, texto, ts: Date.now(), leida: false, kind, href };
}

function activity(texto: string, kind: Notif["kind"]) {
  return { id: uid("ac"), ts: Date.now(), texto, kind };
}

/** Velocidad de la transcripción en directo respecto al tiempo real de la llamada. */
export const LIVE_SPEED = 0.4;

const liveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => {
      const patchJob = (id: string, patch: Partial<Job>) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)), lastChange: { ids: [id], ts: Date.now() } }));
      const techName = (id?: string) => get().techs.find((t) => t.id === id)?.nombre ?? "Sin asignar";
      const clientName = (id?: string) => get().clients.find((c) => c.id === id)?.nombre ?? "Cliente";

      const addAviso = (a: Aviso, liveMs: number) => {
        set((s) => ({
          avisos: [a, ...s.avisos],
          lastChange: { ids: [a.id], ts: Date.now() },
          activity: [activity(`${a.canal === "llamada" ? "Llamada" : "WhatsApp"} entrante de ${a.contacto}`, "aviso"), ...s.activity].slice(0, 40),
        }));
        const t = setTimeout(() => {
          set((s) => ({
            avisos: s.avisos.map((x) => (x.id === a.id ? { ...x, enDirecto: false } : x)),
            notifs: [notif("panel", `Aviso ${a.urgencia === "alta" ? "urgente" : "nuevo"}: ${a.tipo}`, a.resumen, "aviso", "central-avisos"), ...s.notifs],
            lastChange: { ids: [a.id], ts: Date.now() },
          }));
          liveTimers.delete(a.id);
        }, liveMs);
        liveTimers.set(a.id, t);
      };

      return {
        ...createSeed(SECTOR_DEFECTO),
        hydrated: false,
        setHydrated: () => set({ hydrated: true }),

        setSector: (sector) => {
          liveTimers.forEach((t) => clearTimeout(t));
          liveTimers.clear();
          set({ ...createSeed(sector), lastChange: undefined });
        },
        reset: () => {
          liveTimers.forEach((t) => clearTimeout(t));
          liveTimers.clear();
          set({ ...createSeed(get().sector), lastChange: undefined });
        },

        simulateCall: () => {
          const s = get();
          const sector = SECTOR_POR_ID[s.sector];
          const tpl = sector.llamada;
          const client = s.clients.find((c) => c.nombre === tpl.cliente) ?? s.clients[0];
          let t = 0;
          const lineas = tpl.lineas.map(([speaker, texto]) => {
            const l = { speaker, texto, t };
            t += Math.max(2.2, texto.length / 16);
            return l;
          });
          const a: Aviso = {
            id: uid("av"),
            canal: "llamada",
            clientId: client.id,
            contacto: tpl.contacto,
            telefono: client.telefono,
            recibido: Date.now(),
            duracionSeg: Math.round(t + 3),
            tipo: tpl.tipo,
            urgencia: tpl.urgencia,
            resumen: tpl.resumen,
            lineas,
            estado: "nuevo",
            servicio: tpl.servicio,
            instalacionNombre: tpl.instalacionNombre,
            enDirecto: true,
          };
          addAviso(a, (t * LIVE_SPEED + 1.2) * 1000);
          return a.id;
        },

        simulateWhatsapp: () => {
          const s = get();
          const sector = SECTOR_POR_ID[s.sector];
          const tpl = sector.avisos.find((x) => x.canal === "whatsapp") ?? sector.avisos[0];
          const client = s.clients[(s.avisos.length * 7) % s.clients.length];
          const a: Aviso = {
            id: uid("av"),
            canal: "whatsapp",
            clientId: client.id,
            contacto: client.contacto,
            telefono: client.telefono,
            recibido: Date.now(),
            tipo: tpl.tipo,
            urgencia: tpl.urgencia,
            resumen: tpl.resumen,
            lineas: tpl.lineas.map(([speaker, texto], i) => ({ speaker, texto, t: i * 3 })),
            estado: "nuevo",
            servicio: tpl.servicio,
            enDirecto: true,
          };
          addAviso(a, 2500);
          return a.id;
        },

        convertAviso: (avisoId, techId, opts) => {
          const s = get();
          const a = s.avisos.find((x) => x.id === avisoId);
          if (!a) return;
          const sector = SECTOR_POR_ID[s.sector];
          const serv = sector.servicios[a.servicio] ?? sector.servicios[0];
          const now = new Date();
          const hora = opts?.hora ?? `${String(Math.min(19, now.getHours() + (now.getMinutes() > 30 ? 1 : 0))).padStart(2, "0")}:${now.getMinutes() > 30 ? "00" : "30"}`;
          const inst = s.installations.find((i) => i.clientId === a.clientId && (a.instalacionNombre ? i.nombre === a.instalacionNombre : true));
          const n = s.counters.job;
          const clientId = a.clientId ?? s.clients[0].id;
          const job: Job = {
            id: `j${n}`,
            codigo: `OT-${n}`,
            clientId,
            installationId: inst?.id,
            titulo: serv.nombre,
            servicio: a.servicio,
            estado: techId ? "asignado" : "pendiente",
            prioridad: a.urgencia,
            techId: techId || undefined,
            fecha: opts?.fecha ?? isoDay(now),
            hora,
            duracionMin: serv.min,
            importe: serv.precio,
            origenAvisoId: a.id,
            notasOficina: a.resumen,
          };
          set((st) => ({
            jobs: [...st.jobs, job],
            avisos: st.avisos.map((x) => (x.id === avisoId ? { ...x, estado: "convertido", jobId: job.id, enDirecto: false } : x)),
            counters: { ...st.counters, job: n + 1 },
            notifs: techId
              ? [notif("app", a.urgencia === "alta" ? "Trabajo urgente asignado" : "Nuevo trabajo asignado", `${clientName(clientId)}: ${serv.nombre} a las ${hora}`, "trabajo", job.id), ...st.notifs]
              : st.notifs,
            activity: [activity(`${job.codigo} creada desde un aviso y asignada a ${techName(techId)}`, "trabajo"), ...st.activity].slice(0, 40),
            lastChange: { ids: [job.id, avisoId], ts: Date.now() },
          }));
          return job.id;
        },

        discardAviso: (avisoId) =>
          set((s) => ({ avisos: s.avisos.map((x) => (x.id === avisoId ? { ...x, estado: "descartado" } : x)), lastChange: { ids: [avisoId], ts: Date.now() } })),

        assignJob: (jobId, techId, fecha, hora) => {
          const j = get().jobs.find((x) => x.id === jobId);
          if (!j) return;
          const changedTech = techId && techId !== j.techId;
          patchJob(jobId, {
            techId,
            fecha: fecha ?? j.fecha,
            hora: hora ?? j.hora,
            estado: techId ? (j.estado === "pendiente" ? "asignado" : j.estado) : "pendiente",
          });
          if (changedTech) {
            set((s) => ({
              notifs: [notif("app", "Cambio en tu agenda", `${clientName(j.clientId)} a las ${hora ?? j.hora}`, "trabajo", jobId), ...s.notifs],
            }));
          }
        },

        clockIn: (techId) =>
          set((s) => ({
            techs: s.techs.map((t) => (t.id === techId ? { ...t, estado: "trabajando", fichajeInicio: t.fichajeInicio ?? Date.now(), pausaInicio: undefined } : t)),
            activity: [activity(`${techName(techId)} ha fichado la entrada`, "equipo"), ...s.activity].slice(0, 40),
            notifs: [notif("panel", "Fichaje de entrada", `${techName(techId)} ha empezado su jornada`, "equipo", "fichaje"), ...s.notifs],
            lastChange: { ids: [techId], ts: Date.now() },
          })),

        togglePause: (techId) =>
          set((s) => ({
            techs: s.techs.map((t) => {
              if (t.id !== techId) return t;
              if (t.estado === "pausa") {
                const add = t.pausaInicio ? (Date.now() - t.pausaInicio) / 60e3 : 0;
                return { ...t, estado: "trabajando", pausaInicio: undefined, pausaAcumMin: t.pausaAcumMin + add };
              }
              return { ...t, estado: "pausa", pausaInicio: Date.now() };
            }),
            activity: [activity(`${techName(techId)} ${s.techs.find((t) => t.id === techId)?.estado === "pausa" ? "vuelve de la pausa" : "está en pausa"}`, "equipo"), ...s.activity].slice(0, 40),
            lastChange: { ids: [techId], ts: Date.now() },
          })),

        clockOut: (techId) =>
          set((s) => {
            const t = s.techs.find((x) => x.id === techId);
            const entrada = t?.fichajeInicio ? new Date(t.fichajeInicio) : new Date();
            const now = new Date();
            const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            return {
              techs: s.techs.map((x) => (x.id === techId ? { ...x, estado: "fuera", fichajeInicio: undefined, pausaInicio: undefined, pausaAcumMin: 0 } : x)),
              timeEntries: [...s.timeEntries, { id: uid("te"), techId, fecha: isoDay(now), entrada: hhmm(entrada), salida: hhmm(now), pausaMin: Math.round(t?.pausaAcumMin ?? 0), lat: t?.lat ?? 39.57, lon: t?.lon ?? 2.65 }],
              activity: [activity(`${techName(techId)} ha fichado la salida`, "equipo"), ...s.activity].slice(0, 40),
              lastChange: { ids: [techId], ts: Date.now() },
            };
          }),

        setJobStatus: (jobId, estado) => {
          const s = get();
          const j = s.jobs.find((x) => x.id === jobId);
          if (!j) return;
          const c = s.clients.find((x) => x.id === j.clientId);
          patchJob(jobId, { estado, ...(estado === "en-curso" ? { inicio: Date.now() } : {}) });
          if (j.techId && c && (estado === "en-camino" || estado === "en-curso")) {
            set((st) => ({ techs: st.techs.map((t) => (t.id === j.techId ? { ...t, lat: c.lat, lon: c.lon } : t)) }));
          }
          const label = estado === "en-camino" ? "va de camino a" : estado === "en-curso" ? "ha empezado en" : "ha actualizado";
          set((st) => ({
            activity: [activity(`${techName(j.techId)} ${label} ${c?.nombre ?? ""}`, "trabajo"), ...st.activity].slice(0, 40),
            notifs:
              estado === "en-camino"
                ? [notif("panel", "Técnico en camino", `${techName(j.techId)} va hacia ${c?.nombre}. El cliente ha recibido el aviso.`, "trabajo", "trabajos"), ...st.notifs]
                : st.notifs,
          }));
        },

        completeJob: (jobId, p) => {
          const s = get();
          const j = s.jobs.find((x) => x.id === jobId);
          if (!j) return;
          const sector = SECTOR_POR_ID[s.sector];
          const serv = sector.servicios[j.servicio];
          const horas = j.inicio ? Math.max(0.5, Math.round(((Date.now() - j.inicio) / 3600e3) * 4) / 4) : serv.min / 60;
          const matLines = p.material
            .filter((m) => m.cantidad > 0)
            .map((m) => {
              const it = s.stock.find((x) => x.id === m.itemId)!;
              return { concepto: it.nombre, cantidad: m.cantidad, precio: Math.round(it.precio * 1.35 * 100) / 100 };
            });
          const lineas = [{ concepto: `${serv.nombre} (${j.codigo})`, cantidad: 1, precio: j.importe }, ...matLines];
          const inv: Invoice = {
            id: uid("f"),
            numero: `Borrador ${j.codigo}`,
            serie: "F",
            clientId: j.clientId,
            jobId: j.id,
            fecha: isoDay(new Date()),
            vencimiento: isoDay(new Date(Date.now() + 30 * 864e5)),
            lineas,
            ...computeInvoice(lineas),
            estado: "borrador",
            recordatorios: 0,
          };
          set((st) => ({
            jobs: st.jobs.map((x) =>
              x.id === jobId
                ? { ...x, estado: "finalizado", ...p, horasReales: horas, informe: true, facturaId: inv.id, fin: Date.now() }
                : x,
            ),
            stock: st.stock.map((it) => {
              const m = p.material.find((mm) => mm.itemId === it.id);
              if (!m || !j.techId) return it;
              return { ...it, furgonetas: { ...it.furgonetas, [j.techId]: Math.max(0, (it.furgonetas[j.techId] ?? 0) - m.cantidad) } };
            }),
            invoices: [...st.invoices, inv],
            notifs: [
              notif("panel", "Parte cerrado con firma", `${j.codigo} en ${clientName(j.clientId)}. Informe enviado y factura en borrador.`, "trabajo", "facturacion"),
              ...st.notifs,
            ],
            activity: [
              activity(`Informe de ${j.codigo} enviado a ${clientName(j.clientId)}`, "info"),
              activity(`${techName(j.techId)} ha cerrado ${j.codigo} con firma de ${p.firmadoPor}`, "trabajo"),
              ...st.activity,
            ].slice(0, 40),
            lastChange: { ids: [jobId, inv.id, ...p.material.map((m) => m.itemId)], ts: Date.now() },
          }));
          return inv.id;
        },

        issueInvoice: (invoiceId) => {
          const s = get();
          const inv = s.invoices.find((x) => x.id === invoiceId);
          if (!inv || inv.estado !== "borrador") return;
          const n = s.counters.invoice;
          const numero = `F-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
          set((st) => ({
            invoices: st.invoices.map((x) =>
              x.id === invoiceId
                ? { ...x, numero, estado: "emitida", fecha: isoDay(new Date()), verifactu: { huella: huellaVerifactu(numero), registrada: Date.now() }, enlacePago: `https://pagar.nexo4pymes.com/${numero.toLowerCase()}` }
                : x,
            ),
            jobs: st.jobs.map((j) => (j.id === inv.jobId ? { ...j, estado: "facturado" } : j)),
            counters: { ...st.counters, invoice: n + 1 },
            activity: [activity(`Factura ${numero} emitida y registrada con VeriFactu`, "factura"), ...st.activity].slice(0, 40),
            lastChange: { ids: [invoiceId], ts: Date.now() },
          }));
        },

        payInvoice: (invoiceId, metodo = "bizum") => {
          const inv = get().invoices.find((x) => x.id === invoiceId);
          if (!inv) return;
          set((st) => ({
            invoices: st.invoices.map((x) => (x.id === invoiceId ? { ...x, estado: "cobrada", cobradaEn: Date.now(), metodo } : x)),
            notifs: [notif("panel", "Pago recibido", `${clientName(inv.clientId)} ha pagado ${inv.numero} por ${metodo}`, "pago", "cobros"), ...st.notifs],
            activity: [activity(`Cobrada ${inv.numero} por ${metodo}`, "pago"), ...st.activity].slice(0, 40),
            lastChange: { ids: [invoiceId], ts: Date.now() },
          }));
        },

        sendReminder: (invoiceId) =>
          set((st) => ({
            invoices: st.invoices.map((x) => (x.id === invoiceId ? { ...x, recordatorios: x.recordatorios + 1 } : x)),
            activity: [activity("Recordatorio de pago enviado por WhatsApp", "factura"), ...st.activity].slice(0, 40),
            lastChange: { ids: [invoiceId], ts: Date.now() },
          })),

        addWebRequest: (nombre, telefono, texto, canal = "web", lectura) => {
          const low = texto.toLowerCase();
          const urg = /urgente|fuga|no funciona|sin luz|inund|ya |hoy/.test(low);
          const tipo = /precio|presupuesto|cu[aá]nto/.test(low) ? "presupuesto" : /queja|mal|otra vez/.test(low) ? "queja" : urg ? "avería" : "consulta";
          const a: Aviso = {
            id: uid("av"),
            canal,
            contacto: nombre || "Contacto web",
            telefono: telefono || "Sin teléfono",
            recibido: Date.now(),
            tipo,
            urgencia: urg ? "alta" : tipo === "presupuesto" ? "media" : "baja",
            resumen: texto.length > 110 ? texto.slice(0, 107) + "…" : texto,
            lineas: [{ speaker: "cliente", texto, t: 0 }],
            estado: "nuevo",
            servicio: tipo === "presupuesto" ? SECTOR_POR_ID[get().sector].servicios.length - 1 : 0,
            // si quien llama ya lo ha leído (la sección «Pruébalo tú»), se respeta esa lectura
            ...lectura,
          };
          set((st) => ({
            avisos: [a, ...st.avisos],
            notifs: [notif("panel", canal === "web" ? "Solicitud desde la web" : "Aviso recogido por el asistente", a.resumen, "aviso", "central-avisos"), ...st.notifs],
            activity: [activity(`${canal === "web" ? "Formulario web" : "Asistente de WhatsApp"}: ${a.contacto}`, "aviso"), ...st.activity].slice(0, 40),
            lastChange: { ids: [a.id], ts: Date.now() },
          }));
          return a.id;
        },

        addClient: ({ nombre, municipio, contacto, telefono, tipo }) => {
          const [lat, lon] = MUNICIPIOS[municipio] ?? MUNICIPIOS.Palma;
          const id = uid("c");
          set((st) => ({
            clients: [
              { id, nombre, tipo, municipio, direccion: municipio, contacto, telefono, email: `${contacto.split(" ")[0].toLowerCase() || "contacto"}@ejemplo.es`, cif: "Pendiente", lat, lon, desde: isoDay(new Date()), centros: 1, etiquetas: ["Nuevo"] },
              ...st.clients,
            ],
            activity: [activity(`Nuevo cliente: ${nombre}`, "info"), ...st.activity].slice(0, 40),
            lastChange: { ids: [id], ts: Date.now() },
          }));
          return id;
        },

        rectify: (invoiceId) => {
          const s = get();
          const inv = s.invoices.find((x) => x.id === invoiceId);
          if (!inv || inv.serie === "R") return;
          const n = s.invoices.filter((x) => x.serie === "R").length + 1;
          const numero = `R-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
          const lineas = inv.lineas.map((l) => ({ ...l, concepto: `Rectifica ${inv.numero}: ${l.concepto}`, precio: -l.precio }));
          const r: Invoice = {
            id: uid("f"),
            numero,
            serie: "R",
            clientId: inv.clientId,
            fecha: isoDay(new Date()),
            vencimiento: isoDay(new Date()),
            lineas,
            ...computeInvoice(lineas),
            estado: "emitida",
            verifactu: { huella: huellaVerifactu(numero), registrada: Date.now() },
            recordatorios: 0,
          };
          set((st) => ({
            invoices: [...st.invoices.map((x) => (x.id === invoiceId ? { ...x, estado: "cobrada" as const, cobradaEn: x.cobradaEn ?? Date.now(), metodo: x.metodo ?? ("transferencia" as const) } : x)), r],
            activity: [activity(`Rectificativa ${numero} registrada con VeriFactu`, "factura"), ...st.activity].slice(0, 40),
            lastChange: { ids: [r.id, invoiceId], ts: Date.now() },
          }));
        },

        requestAbsence: (techId, desde, hasta, tipo = "vacaciones") => {
          const a: Absence = { id: uid("au"), techId, tipo, desde, hasta, estado: "pendiente", solicitada: Date.now() };
          set((st) => ({
            absences: [...st.absences, a],
            notifs: [notif("panel", "Solicitud de vacaciones", `${techName(techId)} pide ${tipo} del ${desde.split("-").reverse().join("/")} al ${hasta.split("-").reverse().join("/")}`, "equipo", "vacaciones"), ...st.notifs],
            activity: [activity(`${techName(techId)} ha pedido ${tipo}`, "equipo"), ...st.activity].slice(0, 40),
            lastChange: { ids: [a.id], ts: Date.now() },
          }));
          return a.id;
        },

        resolveAbsence: (id, ok) => {
          const a = get().absences.find((x) => x.id === id);
          if (!a) return;
          set((st) => ({
            absences: st.absences.map((x) => (x.id === id ? { ...x, estado: ok ? "aprobada" : "rechazada" } : x)),
            notifs: [notif("app", ok ? "Vacaciones aprobadas" : "Solicitud no aprobada", `Del ${a.desde.split("-").reverse().join("/")} al ${a.hasta.split("-").reverse().join("/")}`, "equipo", "vacaciones"), ...st.notifs],
            activity: [activity(`${ok ? "Aprobadas" : "Rechazadas"} las ${a.tipo} de ${techName(a.techId)}`, "equipo"), ...st.activity].slice(0, 40),
            lastChange: { ids: [id], ts: Date.now() },
          }));
        },

        markPayslipRead: (id) =>
          set((st) => ({ payslips: st.payslips.map((p) => (p.id === id ? { ...p, leida: p.leida ?? Date.now() } : p)), lastChange: { ids: [id], ts: Date.now() } })),

        uploadPayslips: () => {
          const s = get();
          const d = new Date();
          const mes = isoDay(new Date(d.getFullYear(), d.getMonth(), 1)).slice(0, 7);
          if (s.payslips.some((p) => p.mes === mes)) return;
          const nuevas = s.techs.map((t) => ({ id: uid("n"), techId: t.id, mes, subida: Date.now() }));
          set((st) => ({
            payslips: [...st.payslips, ...nuevas],
            notifs: [notif("app", "Tu nómina ya está disponible", "Nómina de este mes", "equipo", "nominas"), ...st.notifs],
            activity: [activity(`Nóminas del mes repartidas a ${nuevas.length} personas`, "equipo"), ...st.activity].slice(0, 40),
            lastChange: { ids: nuevas.map((n) => n.id), ts: Date.now() },
          }));
        },

        readComunicado: (id, techId) =>
          set((st) => ({ comunicados: st.comunicados.map((c) => (c.id === id && !c.leidos.includes(techId) ? { ...c, leidos: [...c.leidos, techId] } : c)) })),

        sendComunicado: (titulo, texto) =>
          set((st) => ({
            comunicados: [{ id: uid("cm"), titulo, texto, fecha: Date.now(), leidos: [] }, ...st.comunicados],
            notifs: [notif("app", "Comunicado nuevo", titulo, "info", "comunicados"), ...st.notifs],
          })),

        sendChat: (techId, from, texto, jobId) =>
          set((st) => ({
            chats: [...st.chats, { id: uid("ch"), techId, from, texto, ts: Date.now(), jobId }],
            notifs: [notif(from === "oficina" ? "app" : "panel", from === "oficina" ? "Mensaje de la oficina" : `Mensaje de ${techName(techId)}`, texto, "info", "chat"), ...st.notifs],
          })),

        addExpense: (techId, proveedor, categoria, base) =>
          set((st) => ({
            expenses: [{ id: uid("g"), fecha: isoDay(new Date()), proveedor, categoria, base, iva: Math.round(base * 0.21 * 100) / 100, techId, leido: true }, ...st.expenses],
            notifs: [notif("panel", "Gasto nuevo con foto", `${techName(techId)}: ${proveedor}, ${base.toFixed(2).replace(".", ",")} €`, "info", "gastos"), ...st.notifs],
            lastChange: { ids: [], ts: Date.now() },
          })),

        createIncidencia: (clientId, titulo, jobId) =>
          set((st) => ({
            incidencias: [{ id: uid("in"), clientId, jobId, titulo, tipo: "reclamación", estado: "abierta", abierta: isoDay(new Date()) }, ...st.incidencias],
            notifs: [notif("panel", "Incidencia desde campo", titulo, "aviso", "incidencias"), ...st.notifs],
          })),

        markNotifsRead: (to) => set((st) => ({ notifs: st.notifs.map((n) => (n.to === to ? { ...n, leida: true } : n)) })),

        moveOpportunity: (id, etapa) =>
          set((st) => ({ opportunities: st.opportunities.map((o) => (o.id === id ? { ...o, etapa } : o)), lastChange: { ids: [id], ts: Date.now() } })),

        signContract: (id) =>
          set((st) => ({
            contracts: st.contracts.map((c) => (c.id === id ? { ...c, estado: "activo", firmado: isoDay(new Date()) } : c)),
            activity: [activity("Contrato firmado desde el móvil del cliente", "info"), ...st.activity].slice(0, 40),
            lastChange: { ids: [id], ts: Date.now() },
          })),

        acceptQuote: (id) =>
          set((st) => ({ quotes: st.quotes.map((q) => (q.id === id ? { ...q, estado: "aceptado" } : q)), lastChange: { ids: [id], ts: Date.now() } })),

        sendQuote: (id) =>
          set((st) => ({ quotes: st.quotes.map((q) => (q.id === id ? { ...q, estado: "enviado" } : q)), lastChange: { ids: [id], ts: Date.now() } })),
      };
    },
    {
      name: "nexo4pymes-demo",
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => pickData(s),
    },
  ),
);

/* ---------- Sincronización entre pestañas ---------- */
let applyingRemote = false;
let channel: BroadcastChannel | null = null;
const TAB = Math.random().toString(36).slice(2);

export function startSync() {
  if (typeof window === "undefined" || channel || !("BroadcastChannel" in window)) return;
  channel = new BroadcastChannel("nexo4pymes-demo");
  channel.onmessage = (e: MessageEvent<{ from: string; data: DemoData }>) => {
    if (!e.data || e.data.from === TAB) return;
    applyingRemote = true;
    useDemo.setState(e.data.data);
    applyingRemote = false;
  };
  let queued = false;
  useDemo.subscribe((state) => {
    if (applyingRemote || !state.hydrated || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      channel?.postMessage({ from: TAB, data: pickData(useDemo.getState()) });
    });
  });
}

export function useSector() {
  const id = useDemo((s) => s.sector);
  return SECTOR_POR_ID[id];
}
