import { addDays, hashString, isoDay, rng, startOfDay, type Rng } from "@/lib/utils";
import { SECTOR_POR_ID, type SectorId } from "./sectors";
import type {
  Absence, Activity, Aviso, ChatMsg, Client, Comunicado, Contract, DemoData, Expense, Incidencia,
  Installation, Invoice, Job, JobStatus, Notif, Opportunity, Payslip, Quote, StockItem, Tech, TimeEntry, Vehicle,
} from "./types";

export const DATA_VERSION = 6;
export const IVA = 0.21;

export const MUNICIPIOS: Record<string, [number, number]> = {
  Palma: [39.5696, 2.6502],
  Calvià: [39.5657, 2.5062],
  Marratxí: [39.6219, 2.7514],
  Inca: [39.721, 2.911],
  Manacor: [39.5696, 3.2096],
  Alcúdia: [39.845, 3.105],
  Sóller: [39.7667, 2.715],
  Llucmajor: [39.4903, 2.8906],
};

/** Nave de la empresa (polígono de Son Castelló, Palma). */
export const BASE = { nombre: "Nave, Son Castelló", lat: 39.595, lon: 2.643 };

const CLIENTES: [nombre: string, tipo: string, municipio: string, contacto: string, calle: string, centros?: number][] = [
  ["Hotel Sa Roca", "Hotel", "Calvià", "Carmen Salom", "Av. de sa Roca, 12"],
  ["Comunidad Edificio Es Born 12", "Comunidad", "Palma", "Joana Mir", "Passeig des Born, 12"],
  ["Villa Es Pinaret", "Villa", "Alcúdia", "Tomeu Garau", "Camí des Pinaret, 4"],
  ["Supermercats Illa Fresca", "Supermercado", "Palma", "Andreu Nicolau", "C. de Aragó, 211", 6],
  ["Clínica Dental Llevant", "Clínica", "Manacor", "Laura Rosselló", "C. de Joan Lliteras, 30"],
  ["Restaurante Es Moll Vell", "Restaurante", "Alcúdia", "Jaume Serra", "Passeig Marítim, 8"],
  ["Oficinas Gremi Nou", "Oficinas", "Marratxí", "Sílvia Caldentey", "C. Gremi de Teixidors, 35"],
  ["Comunidad Jardins de Sóller", "Comunidad", "Sóller", "Francesca Pons", "C. de la Lluna, 64"],
  ["Agroturismo Can Vidal", "Agroturismo", "Sóller", "Miquel Vidal", "Camí de Can Vidal, s/n"],
  ["Comunidad Passeig Mallorca 40", "Comunidad", "Palma", "Pere Amengual", "Passeig Mallorca, 40"],
  ["Hotel Nord Alcúdia Mar", "Hotel", "Alcúdia", "Elena Fiol", "Av. del Mar, 57", 2],
  ["Villa Sa Talaia", "Villa", "Calvià", "Anna Lindqvist", "C. de sa Talaia, 9"],
  ["Residencia Sa Bassa", "Residencia", "Llucmajor", "Catalina Adrover", "C. de sa Bassa, 3"],
  ["Forn Nou Inca", "Panadería", "Inca", "Rafel Cerdà", "C. Major, 88"],
  ["Clínica Veterinària Ponent", "Clínica", "Palma", "Marta Estelrich", "C. de Blanquerna, 19"],
  ["Gimnàs Marratxí Fit", "Gimnasio", "Marratxí", "Xavi Truyol", "C. de Pla de na Tesa, 7"],
  ["Apartaments Ca'n Martorell", "Apartamentos", "Alcúdia", "Bel Martorell", "C. dels Pins, 21"],
  ["Bodega Son Galmés", "Bodega", "Manacor", "Guillem Galmés", "Ctra. de Son Macià, km 3"],
  ["Villa Els Tarongers", "Villa", "Sóller", "Helena Weber", "Camí de sa Figuera, 2"],
  ["Hotel Cala Blava Mar", "Hotel", "Llucmajor", "Sebastià Bibiloni", "Av. de Cala Blava, 40", 2],
  ["Òptica Migjorn", "Comercio", "Llucmajor", "Neus Obrador", "Plaça d'Espanya, 5"],
  ["Comunidad Son Rapinya Park", "Comunidad", "Palma", "Antoni Julià", "C. de Joan Miró, 312"],
  ["Taller Mecànic Es Rafal", "Taller", "Palma", "Llorenç Tous", "C. de Manacor, 140"],
  ["Acadèmia Idiomes Inca", "Academia", "Inca", "Maria Crespí", "C. de sa Murada, 11"],
];

const TECNICOS: [nombre: string, zona: string, color: string][] = [
  ["Toni Ferrer", "Palma y Calvià", "#e8950c"],
  ["Maria Bauzà", "Palma y Marratxí", "#2f6ad0"],
  ["Joan Pons", "Inca y Alcúdia", "#13845a"],
  ["Xisca Vidal", "Manacor y Llevant", "#b8428c"],
  ["Pep Mas", "Llucmajor y Migjorn", "#5b4bd6"],
  ["Aina Coll", "Sóller y Tramuntana", "#cf3f37"],
];

const ROL: Record<SectorId, string> = {
  mantenimiento: "Técnico multiservicio",
  limpieza: "Especialista de limpieza",
  piscinas: "Técnico de piscinas",
  climatizacion: "Frigorista",
  jardineria: "Jardinero",
  plagas: "Aplicador de biocidas",
  solar: "Instalador fotovoltaico",
  reformas: "Oficial de obra",
};

const VEHICULOS = ["Citroën Berlingo", "Renault Kangoo", "Peugeot Partner", "Ford Transit Custom", "Toyota Proace City", "Renault Trafic"];
const MARCAS = ["Saunier Duval", "Daikin", "Mitsubishi Electric", "AstralPool", "Junkers", "Schneider", "Fronius", "Hayward"];
const PROVEEDORES: [string, string][] = [
  ["Suministros Ferrer Palma", "Material"],
  ["Estación de servicio Son Castelló", "Combustible"],
  ["Ferretería Can Mateu", "Herramienta"],
  ["Distribuciones Illa", "Material"],
  ["Taller Es Rafal", "Vehículo"],
  ["Restaurante Ca'n Pep", "Dietas"],
  ["Papelería Born", "Oficina"],
  ["Recambios Marratxí", "Vehículo"],
];
const OPORTUNIDADES: [string, string, string][] = [
  ["Hotel Portixol Blau", "Contrato anual hotel 80 hab.", "Web"],
  ["Comunidad Es Pil·larí Sol", "Mantenimiento comunidad", "Recomendación"],
  ["Cadena Forns de Llevant", "Multi-centro 5 panaderías", "Llamada"],
  ["Villa Can Frau", "Temporada villa turística", "Web"],
  ["Coworking Nou Llevant", "Oficinas 400 m²", "Feria"],
  ["Residencial Cala Major", "Comunidad 48 viviendas", "Recomendación"],
  ["Agroturismo Son Mesquida", "Mantenimiento integral", "WhatsApp"],
  ["Clínica Fisio Inca", "Contrato mensual", "Web"],
  ["Hotel Sóller Port Vell", "Revisión pretemporada", "Llamada"],
  ["Supermercado Can Coll", "2 tiendas, Inca y Sineu", "Visita"],
  ["Apartamentos Alcanada", "Temporada 12 apartamentos", "Web"],
  ["Gestoría Mir & Rosselló", "Oficina 150 m²", "Recomendación"],
];

function ll(muni: string, r: Rng) {
  const [la, lo] = MUNICIPIOS[muni];
  return { lat: la + (r.next() - 0.5) * 0.022, lon: lo + (r.next() - 0.5) * 0.036 };
}

const pad = (n: number, l = 4) => String(n).padStart(l, "0");
const hora = (h: number, m: number) => `${pad(h, 2)}:${pad(m, 2)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Encadena horas de visita según la duración de cada servicio, con 30 min de desplazamiento. */
function cadena(inicioMin: number) {
  let m = inicioMin;
  return (dur: number) => {
    if (m > 17 * 60 + 30) return null;
    const h = m;
    m = Math.ceil((m + Math.min(dur, 300) + 30) / 30) * 30;
    return hora(Math.floor(h / 60), h % 60);
  };
}

export function computeInvoice(lineas: Invoice["lineas"]) {
  const base = round2(lineas.reduce((s, l) => s + l.cantidad * l.precio, 0));
  const iva = round2(base * IVA);
  return { base, iva, total: round2(base + iva) };
}

export function huellaVerifactu(seed: string) {
  const h = hashString(seed).toString(16).toUpperCase().padStart(8, "0");
  const h2 = hashString(seed + "x").toString(16).toUpperCase().padStart(8, "0");
  return `${h}${h2}`.slice(0, 16);
}

export function createSeed(sectorId: SectorId, now = new Date()): DemoData {
  const sector = SECTOR_POR_ID[sectorId];
  const semilla = hashString(sectorId) ^ 20260924;
  const r = rng(semilla);
  const today = startOfDay(now);
  const hoy = isoDay(today);
  const year = today.getFullYear();

  // --- Técnicos
  const techs: Tech[] = TECNICOS.map(([nombre, zona, color], i) => ({
    id: `t${i + 1}`,
    nombre,
    rol: ROL[sectorId],
    color,
    telefono: `6${r.int(10, 99)} ${r.int(100, 999)} ${r.int(100, 999)}`,
    zona,
    vehiculoId: `v${i + 1}`,
    estado: "fuera",
    pausaAcumMin: 0,
    lat: 39.595,
    lon: 2.643,
  }));
  const meId = "t1";

  // --- Clientes
  const clients: Client[] = CLIENTES.map(([nombre, tipo, municipio, contacto, calle, centros], i) => {
    const pos = ll(municipio, r);
    const slug = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "").slice(0, 14);
    return {
      id: `c${i + 1}`,
      nombre,
      tipo,
      municipio,
      direccion: `${calle}, ${municipio}`,
      contacto,
      telefono: tipo === "Villa" ? `6${r.int(10, 99)} ${r.int(100, 999)} ${r.int(100, 999)}` : `971 ${r.int(10, 99)} ${r.int(10, 99)} ${r.int(10, 99)}`,
      email: `${contacto.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@${slug}.es`,
      cif: `B${r.pick(["07", "57"])}${r.int(100000, 999999)}`,
      ...pos,
      desde: isoDay(addDays(today, -r.int(120, 2400))),
      centros: centros ?? 1,
      etiquetas: [tipo === "Hotel" || tipo === "Villa" || tipo === "Apartamentos" || tipo === "Agroturismo" ? "Turístico" : "Anual", ...(r.chance(0.3) ? ["Pago rápido"] : [])],
      notas: r.chance(0.5) ? r.pick(["Llamar antes de ir, la llave está en conserjería.", "Aparcar en la calle de atrás, zona de carga.", "Horario de acceso de 8:00 a 14:00.", "El contacto habla alemán e inglés.", "Pedir firma al encargado de turno."]) : undefined,
    };
  });
  const clientByName = (n: string) => clients.find((c) => c.nombre === n);

  // --- Instalaciones
  const installations: Installation[] = [];
  let insN = 1;
  for (const c of clients) {
    const n = c.centros > 1 ? Math.min(c.centros, 4) : r.int(1, 3);
    const names = r.shuffle(sector.instalacion.nombres);
    for (let k = 0; k < n; k++) {
      const nombre = c.centros > 1 ? `${names[k % names.length]}, ${["Palma", "Inca", "Manacor", "Marratxí"][k]}` : names[k % names.length];
      installations.push({
        id: `i${insN}`,
        clientId: c.id,
        nombre,
        codigo: `QR-${pad(1000 + insN)}`,
        marca: r.pick(MARCAS),
        instalada: isoDay(addDays(today, -r.int(400, 4000))),
        ultimaRevision: isoDay(addDays(today, -r.int(3, 80))),
        estado: r.chance(0.12) ? "revisar" : "ok",
      });
      insN++;
    }
  }
  // Instalación de la llamada estrella
  const llamadaCliente = clientByName(sector.llamada.cliente) ?? clients[0];
  installations.push({
    id: "i-star",
    clientId: llamadaCliente.id,
    nombre: sector.llamada.instalacionNombre,
    codigo: `QR-${pad(1000 + insN)}`,
    marca: r.pick(MARCAS),
    instalada: isoDay(addDays(today, -1400)),
    ultimaRevision: isoDay(addDays(today, -41)),
    estado: "averiada",
  });

  const insOf = (clientId: string) => installations.filter((i) => i.clientId === clientId && i.id !== "i-star");

  // --- Stock
  const stock: StockItem[] = sector.material.map((m, i) => {
    const furgonetas: Record<string, number> = {};
    techs.forEach((t) => (furgonetas[t.id] = r.int(1, 10)));
    const minimo = r.pick([6, 8, 10, 12]);
    return {
      id: `m${i + 1}`,
      nombre: m.nombre,
      ref: m.ref,
      unidad: m.unidad,
      precio: m.precio,
      nave: i === 1 || i === 4 ? r.int(2, minimo - 1) : r.int(minimo + 4, 70),
      minimo,
      furgonetas,
    };
  });

  // --- Trabajos e historial
  const jobs: Job[] = [];
  const invoices: Invoice[] = [];
  let jobN = 2310;
  let invN = 280;
  const cheap = sector.servicios.map((s, i) => ({ s, i })).filter((x) => x.s.precio < 1000);
  const pickServ = () => (r.chance(0.04) ? r.int(0, sector.servicios.length - 1) : r.pick(cheap).i);

  const mkJob = (p: Partial<Job> & { fecha: string; clientId: string; servicio: number; estado: JobStatus }): Job => {
    const serv = sector.servicios[p.servicio];
    const ins = insOf(p.clientId);
    return {
      id: `j${jobN}`,
      codigo: `OT-${jobN++}`,
      titulo: serv.nombre,
      prioridad: "media",
      hora: "09:00",
      duracionMin: serv.min,
      importe: Math.round(serv.precio * (0.9 + r.next() * 0.35)),
      installationId: ins.length ? r.pick(ins).id : undefined,
      ...p,
    };
  };

  const mkInvoice = (job: Job, fechaD: Date, estado: Invoice["estado"]): Invoice => {
    const serv = sector.servicios[job.servicio];
    const mat = r.chance(0.6) ? r.pick(stock) : null;
    const lineas = [
      { concepto: `${serv.nombre} (${job.codigo})`, cantidad: 1, precio: job.importe },
      ...(mat ? [{ concepto: mat.nombre, cantidad: r.int(1, 3), precio: round2(mat.precio * 1.35) }] : []),
    ];
    const tot = computeInvoice(lineas);
    const numero = `F-${year}-${pad(invN++)}`;
    const fecha = isoDay(fechaD);
    return {
      id: `f${invN}`,
      numero,
      serie: "F",
      clientId: job.clientId,
      jobId: job.id,
      fecha,
      vencimiento: isoDay(addDays(fechaD, 30)),
      lineas,
      ...tot,
      estado,
      verifactu: estado === "borrador" ? undefined : { huella: huellaVerifactu(numero), registrada: fechaD.getTime() + 3600e3 * 10 },
      enlacePago: estado === "borrador" ? undefined : `https://pagar.nexo4pymes.com/${numero.toLowerCase()}`,
      cobradaEn: estado === "cobrada" ? addDays(fechaD, r.int(1, 25)).getTime() : undefined,
      metodo: estado === "cobrada" ? r.pick(["tarjeta", "bizum", "transferencia", "remesa SEPA"] as const) : undefined,
      recordatorios: estado === "vencida" ? r.int(1, 3) : 0,
    };
  };

  for (let d = 90; d >= 1; d--) {
    const day = addDays(today, -d);
    const dow = day.getDay();
    if (dow === 0) continue;
    for (const t of techs) {
      const n = dow === 6 ? (r.chance(0.3) ? 1 : 0) : r.int(1, 3);
      for (let k = 0; k < n; k++) {
        const c = r.pick(clients);
        const job = mkJob({
          fecha: isoDay(day),
          hora: hora(8 + k * 3 + r.int(0, 1), r.pick([0, 15, 30, 45])),
          clientId: c.id,
          servicio: pickServ(),
          techId: t.id,
          prioridad: r.pick(["baja", "media", "media", "alta"] as const),
          estado: d > 2 ? "facturado" : "finalizado",
          checklistHecho: sector.checklist.map(() => true),
          fotos: r.int(2, 6),
          firmadoPor: c.contacto,
          horasReales: round2(sector.servicios[0].min / 60 + r.next()),
          informe: true,
        });
        if (job.estado === "facturado") {
          let estado: Invoice["estado"];
          if (d > 45) estado = r.chance(0.99) ? "cobrada" : "vencida";
          else if (d > 15) estado = r.chance(0.9) ? "cobrada" : d > 30 && r.chance(0.5) ? "vencida" : "emitida";
          else estado = r.chance(0.35) ? "cobrada" : "emitida";
          const inv = mkInvoice(job, addDays(day, r.int(0, 1)), estado);
          job.facturaId = inv.id;
          invoices.push(inv);
        }
        jobs.push(job);
      }
    }
  }
  // Borradores de factura de trabajos recién terminados
  jobs
    .filter((j) => j.estado === "finalizado")
    .slice(0, 3)
    .forEach((j) => {
      const inv = mkInvoice(j, addDays(today, -1), "borrador");
      j.facturaId = inv.id;
      invoices.push(inv);
    });

  // --- Hoy
  const ZONAS: Record<string, string[]> = {
    t1: ["Palma", "Calvià"],
    t2: ["Palma", "Marratxí"],
    t3: ["Inca", "Alcúdia"],
    t4: ["Manacor", "Inca"],
    t5: ["Llucmajor", "Palma"],
    t6: ["Sóller", "Marratxí"],
  };
  const todayJobsFor = (t: Tech, idx: number) => {
    const zona = ZONAS[t.id] ?? [];
    const pool = clients.filter((c) => c.id !== llamadaCliente.id);
    const others = [...r.shuffle(pool.filter((c) => zona.includes(c.municipio))), ...r.shuffle(pool.filter((c) => !zona.includes(c.municipio)))];
    const next = cadena(t.id === meId ? 9 * 60 + 30 : 8 * 60);
    Array.from({ length: t.id === meId ? 3 : 4 }).forEach((_, k) => {
      const servicio = pickServ();
      const h = next(sector.servicios[servicio].min);
      if (!h) return;
      let estado: JobStatus = "asignado";
      if (t.id !== meId) {
        if (k === 0) estado = "finalizado";
        else if (k === 1) estado = idx === 2 ? "en-camino" : "en-curso";
      }
      const c = others[k];
      const j = mkJob({
        fecha: hoy,
        hora: h,
        clientId: c.id,
        servicio,
        techId: t.id,
        prioridad: k === 1 && idx === 3 ? "alta" : r.pick(["baja", "media", "media"] as const),
        estado,
        notasOficina: c.notas,
      });
      if (estado === "finalizado") {
        Object.assign(j, { checklistHecho: sector.checklist.map(() => true), fotos: 4, firmadoPor: c.contacto, informe: true, horasReales: 1.5 });
      }
      if (estado === "en-curso") j.inicio = today.getTime() + 3600e3 * 10.5;
      jobs.push(j);
    });
  };
  techs.forEach((t, idx) => {
    if (t.id === "t6") return; // de vacaciones
    todayJobsFor(t, idx);
    if (t.id !== meId) {
      t.estado = "trabajando";
      t.fichajeInicio = today.getTime() + (7 * 60 + 40 + r.int(0, 30)) * 60e3;
      const lastJob = jobs.filter((j) => j.techId === t.id && j.fecha === hoy && j.estado !== "asignado").pop();
      const cl = clients.find((c) => c.id === lastJob?.clientId);
      if (cl) {
        t.lat = cl.lat;
        t.lon = cl.lon;
      }
    }
  });

  // --- Próximos días
  for (let d = 1; d <= 12; d++) {
    const day = addDays(today, d);
    if (day.getDay() === 0) continue;
    for (const t of techs) {
      if (t.id === "t6" && d <= 4) continue;
      const n = day.getDay() === 6 ? (r.chance(0.3) ? 1 : 0) : r.int(2, 3);
      const cerca = clients.filter((c) => (ZONAS[t.id] ?? []).includes(c.municipio));
      const next = cadena(8 * 60 + 30);
      for (let k = 0; k < n; k++) {
        const c = cerca.length && r.chance(0.8) ? r.pick(cerca) : r.pick(clients);
        const servicio = pickServ();
        const h = next(sector.servicios[servicio].min);
        if (!h) break;
        jobs.push(mkJob({ fecha: isoDay(day), hora: h, clientId: c.id, servicio, techId: t.id, estado: "asignado", prioridad: r.pick(["baja", "media"] as const) }));
      }
    }
  }
  // sin asignar
  for (let k = 0; k < 5; k++) {
    const c = r.pick(clients);
    jobs.push(mkJob({ fecha: isoDay(addDays(today, r.int(0, 3))), hora: r.pick(["09:00", "11:30", "16:00"]), clientId: c.id, servicio: pickServ(), estado: "pendiente", prioridad: r.pick(["media", "alta", "baja"] as const) }));
  }

  // --- Contratos y recurrentes
  const contracts: Contract[] = r.shuffle(clients).slice(0, 10).map((c, i) => {
    const inicio = addDays(today, -r.int(60, 700));
    const [a, b] = sector.contrato.cuota;
    const cuota = Math.round((a + r.next() * (b - a)) / 10) * 10;
    return {
      id: `k${i + 1}`,
      clientId: c.id,
      nombre: sector.contrato.nombre,
      periodicidad: sector.contrato.periodicidad,
      cuota,
      inicio: isoDay(inicio),
      renovacion: isoDay(addDays(today, i === 1 ? 18 : i === 4 ? 26 : r.int(40, 320))),
      respuestaHoras: r.pick([4, 8, 24, 48]),
      visitasAnio: r.pick([4, 6, 12, 24]),
      estado: i === 0 ? "pendiente-firma" : i === 1 || i === 4 ? "por-renovar" : "activo",
      firmado: i === 0 ? undefined : isoDay(inicio),
    };
  });
  for (const k of contracts.filter((x) => x.estado !== "pendiente-firma")) {
    const step = k.periodicidad === "mensual" ? 30 : k.periodicidad === "trimestral" ? 91 : 365;
    for (let d = 88; d >= 1; d -= step) {
      const fechaD = addDays(today, -d);
      const lineas = [{ concepto: `${k.nombre}: cuota ${k.periodicidad}`, cantidad: 1, precio: k.cuota }];
      const numero = `F-${year}-${pad(invN++)}`;
      const estado: Invoice["estado"] = d > 20 ? "cobrada" : r.chance(0.5) ? "cobrada" : "emitida";
      invoices.push({
        id: `f${invN}`,
        numero,
        serie: "F",
        clientId: k.clientId,
        contratoId: k.id,
        fecha: isoDay(fechaD),
        vencimiento: isoDay(addDays(fechaD, 15)),
        lineas,
        ...computeInvoice(lineas),
        estado,
        verifactu: { huella: huellaVerifactu(numero), registrada: fechaD.getTime() + 36e6 },
        enlacePago: `https://pagar.nexo4pymes.com/${numero.toLowerCase()}`,
        cobradaEn: estado === "cobrada" ? addDays(fechaD, 3).getTime() : undefined,
        metodo: estado === "cobrada" ? "remesa SEPA" : undefined,
        recordatorios: 0,
      });
    }
  }
  invoices.sort((a, b) => a.fecha.localeCompare(b.fecha));

  // --- Avisos
  const avisos: Aviso[] = [];
  let avN = 1;
  const mkLineas = (lineas: [string, string][]) => {
    let t = 0;
    return lineas.map(([speaker, texto]) => {
      const l = { speaker: speaker as "cliente" | "oficina", texto, t };
      t += Math.max(2, Math.round(texto.length / 14));
      return l;
    });
  };
  // nuevos de hoy
  sector.avisos.slice(0, 4).forEach((tpl, k) => {
    const c = r.pick(clients.filter((x) => x.id !== llamadaCliente.id));
    avisos.push({
      id: `a${avN++}`,
      canal: tpl.canal,
      clientId: tpl.tipo === "presupuesto" && tpl.canal === "web" ? undefined : c.id,
      contacto: tpl.tipo === "presupuesto" && tpl.canal === "web" ? r.pick(["Joan Oliver", "Marta Vich", "Lluís Sastre"]) : c.contacto,
      telefono: c.telefono,
      recibido: now.getTime() - (k * 47 + 12) * 60e3,
      duracionSeg: tpl.canal === "llamada" ? r.int(60, 180) : undefined,
      tipo: tpl.tipo,
      urgencia: tpl.urgencia,
      resumen: tpl.resumen,
      lineas: mkLineas(tpl.lineas),
      estado: k === 3 ? "convertido" : "nuevo",
      servicio: tpl.servicio,
    });
  });
  // historial convertido
  const pastJobs = jobs.filter((j) => j.fecha <= hoy).slice(-60);
  for (let k = 0; k < 16; k++) {
    const tpl = r.pick(sector.avisos);
    const j = r.pick(pastJobs);
    const c = clients.find((x) => x.id === j.clientId)!;
    avisos.push({
      id: `a${avN++}`,
      canal: tpl.canal,
      clientId: c.id,
      contacto: c.contacto,
      telefono: c.telefono,
      recibido: now.getTime() - (k + 1) * 3600e3 * r.int(4, 9),
      duracionSeg: tpl.canal === "llamada" ? r.int(50, 200) : undefined,
      tipo: tpl.tipo,
      urgencia: tpl.urgencia,
      resumen: tpl.resumen,
      lineas: mkLineas(tpl.lineas),
      estado: k === 5 ? "descartado" : "convertido",
      jobId: k === 5 ? undefined : j.id,
      servicio: tpl.servicio,
    });
  }
  avisos.sort((a, b) => b.recibido - a.recibido);

  // --- Flota
  const letras = "BCDFGHJKLMNPRSTVWXYZ";
  const vehicles: Vehicle[] = techs.map((t, i) => ({
    id: `v${i + 1}`,
    matricula: `${r.int(1000, 9999)} ${letras[r.int(0, 19)]}${letras[r.int(0, 19)]}${letras[r.int(0, 19)]}`,
    modelo: VEHICULOS[i],
    techId: t.id,
    km: r.int(18000, 190000),
    itv: isoDay(addDays(today, i === 2 ? 12 : r.int(40, 400))),
    seguro: isoDay(addDays(today, i === 4 ? 21 : r.int(50, 330))),
    revision: isoDay(addDays(today, r.int(-10, 200))),
    combustibleMes: r.int(140, 320),
  }));

  // --- Presupuestos
  const quotes: Quote[] = Array.from({ length: 14 }, (_, i) => {
    const c = r.pick(clients);
    const s = r.pick(sector.servicios);
    const estado = r.pick(["borrador", "enviado", "visto", "visto", "aceptado", "aceptado", "rechazado"] as const);
    return {
      id: `p${i + 1}`,
      numero: `P-${year}-${pad(140 + i)}`,
      clientId: c.id,
      titulo: s.nombre,
      importe: Math.round(s.precio * (1 + r.next() * 2)),
      fecha: isoDay(addDays(today, -r.int(0, 40))),
      estado,
      vistoEn: estado === "visto" ? now.getTime() - r.int(1, 30) * 3600e3 : undefined,
    };
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));

  // --- Embudo
  const etapas: Opportunity["etapa"][] = ["nuevo", "nuevo", "contactado", "contactado", "presupuesto", "presupuesto", "presupuesto", "negociacion", "negociacion", "ganado", "ganado", "perdido"];
  const opportunities: Opportunity[] = OPORTUNIDADES.map(([empresa, nombre, origen], i) => ({
    id: `o${i + 1}`,
    nombre,
    empresa,
    importe: r.int(18, 140) * 100,
    etapa: etapas[i],
    proximo: isoDay(addDays(today, r.int(0, 10))),
    origen,
    motivoPerdida: etapas[i] === "perdido" ? "Precio: se quedan con su proveedor actual" : undefined,
  }));

  // --- Gastos
  const expenses: Expense[] = Array.from({ length: 38 }, (_, i) => {
    const [proveedor, categoria] = r.pick(PROVEEDORES);
    const base = categoria === "Combustible" ? r.int(40, 90) : categoria === "Dietas" ? r.int(9, 24) : r.int(25, 480);
    return {
      id: `g${i + 1}`,
      fecha: isoDay(addDays(today, -r.int(0, 88))),
      proveedor,
      categoria,
      base,
      iva: round2(base * (categoria === "Dietas" ? 0.1 : IVA)),
      techId: r.chance(0.6) ? r.pick(techs).id : undefined,
      leido: true,
    };
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));

  // --- Ausencias
  const absences: Absence[] = [
    { id: "au1", techId: "t6", tipo: "vacaciones", desde: isoDay(addDays(today, -2)), hasta: isoDay(addDays(today, 4)), estado: "aprobada", solicitada: now.getTime() - 20 * 864e5 },
    { id: "au2", techId: "t3", tipo: "asuntos propios", desde: isoDay(addDays(today, 9)), hasta: isoDay(addDays(today, 9)), estado: "aprobada", solicitada: now.getTime() - 5 * 864e5 },
    { id: "au3", techId: "t2", tipo: "vacaciones", desde: isoDay(addDays(today, 16)), hasta: isoDay(addDays(today, 22)), estado: "pendiente", solicitada: now.getTime() - 26 * 3600e3 },
    { id: "au4", techId: "t5", tipo: "ausencia justificada", desde: isoDay(addDays(today, -19)), hasta: isoDay(addDays(today, -19)), estado: "aprobada", solicitada: now.getTime() - 25 * 864e5 },
    { id: "au5", techId: "t4", tipo: "vacaciones", desde: isoDay(addDays(today, -45)), hasta: isoDay(addDays(today, -38)), estado: "aprobada", solicitada: now.getTime() - 70 * 864e5 },
  ];

  // --- Nóminas
  const payslips: Payslip[] = [];
  for (let m = 3; m >= 1; m--) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 28);
    techs.forEach((t) =>
      payslips.push({
        id: `n${m}${t.id}`,
        techId: t.id,
        mes: isoDay(d).slice(0, 7),
        subida: d.getTime() + 3 * 864e5,
        leida: m > 1 || r.chance(0.5) ? d.getTime() + 4 * 864e5 : undefined,
      }),
    );
  }

  // --- Comunicados
  const comunicados: Comunicado[] = [
    { id: "cm1", titulo: "Horario de verano", texto: "Desde el lunes la jornada empieza a las 7:00 para evitar las horas de más calor. La oficina atiende de 7:00 a 15:00.", fecha: now.getTime() - 3 * 864e5, leidos: ["t1", "t2", "t3", "t5"] },
    { id: "cm2", titulo: "Nuevos equipos de protección", texto: "Ya están en la nave los guantes y gafas nuevos. Pasad a recogerlos y firmad la entrega en la app.", fecha: now.getTime() - 9 * 864e5, leidos: ["t1", "t2", "t3", "t4", "t5", "t6"] },
    { id: "cm3", titulo: "Revisión de furgonetas", texto: "Este mes toca revisión de todas las furgonetas. Marga os irá asignando día.", fecha: now.getTime() - 15 * 864e5, leidos: ["t1", "t3", "t4", "t6"] },
  ];

  // --- Fichajes
  const timeEntries: TimeEntry[] = [];
  for (let d = 30; d >= 1; d--) {
    const day = addDays(today, -d);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    for (const t of techs) {
      if (absences.some((a) => a.techId === t.id && a.estado === "aprobada" && a.desde <= isoDay(day) && a.hasta >= isoDay(day))) continue;
      const eh = 7 + (r.chance(0.7) ? 1 : 0);
      const em = eh === 7 ? r.int(45, 59) : r.int(0, 10);
      const extra = r.chance(0.18) ? r.int(30, 120) : 0;
      const salidaMin = eh * 60 + em + 8 * 60 + 30 + extra + r.int(-5, 10);
      const pos = ll(r.pick(Object.keys(MUNICIPIOS)), r);
      timeEntries.push({ id: `te${d}${t.id}`, techId: t.id, fecha: isoDay(day), entrada: hora(eh, em), salida: hora(Math.floor(salidaMin / 60), salidaMin % 60), pausaMin: 30, ...pos });
    }
  }

  // --- Incidencias
  const incidencias: Incidencia[] = Array.from({ length: 6 }, (_, i) => {
    const j = r.pick(jobs.filter((x) => x.estado === "facturado"));
    return {
      id: `in${i + 1}`,
      clientId: j.clientId,
      jobId: j.id,
      titulo: r.pick(["Vuelve a fallar tras la reparación", "Cliente no conforme con el acabado", "Pieza defectuosa en garantía", "Retraso en la visita pactada", "Revisar medición del informe"]),
      tipo: r.pick(["garantía", "reclamación", "retrabajo"] as const),
      estado: i < 2 ? "abierta" : i < 4 ? "en curso" : "cerrada",
      abierta: isoDay(addDays(today, -r.int(1, 30))),
    };
  });

  // --- Chat
  const chats: ChatMsg[] = [];
  const meToday = jobs.filter((j) => j.techId === meId && j.fecha === hoy);
  if (meToday[0]) {
    const c = clients.find((x) => x.id === meToday[0].clientId)!;
    chats.push(
      { id: "ch1", jobId: meToday[0].id, techId: meId, from: "oficina", texto: `Toni, en ${c.nombre} pregunta por ${c.contacto}. ${c.notas ?? "Te esperan a partir de las 9:30."}`, ts: now.getTime() - 50 * 60e3 },
      { id: "ch2", jobId: meToday[0].id, techId: meId, from: "tecnico", texto: "Perfecto, gracias Marga.", ts: now.getTime() - 48 * 60e3 },
    );
  }

  // --- Notificaciones y actividad
  const notifs: Notif[] = [
    { id: "nt1", to: "panel", titulo: "Presupuesto abierto", texto: `${clients[6].nombre} ha abierto el presupuesto ${quotes[0]?.numero ?? ""}`, ts: now.getTime() - 35 * 60e3, leida: false, kind: "info", href: "presupuestos" },
    { id: "nt2", to: "panel", titulo: "Stock bajo", texto: `${stock[1].nombre}: quedan ${stock[1].nave} ${stock[1].unidad} en la nave`, ts: now.getTime() - 2 * 3600e3, leida: false, kind: "info", href: "almacen" },
    { id: "nt3", to: "panel", titulo: "Solicitud de vacaciones", texto: "Maria Bauzà pide 7 días de vacaciones", ts: now.getTime() - 26 * 3600e3, leida: true, kind: "equipo", href: "vacaciones" },
    { id: "nt4", to: "app", titulo: "Comunicado nuevo", texto: "Horario de verano", ts: now.getTime() - 3 * 864e5, leida: true, kind: "info" },
  ];
  const activity: Activity[] = [
    { id: "ac1", ts: now.getTime() - 8 * 60e3, texto: `${techs[1].nombre} ha empezado un trabajo`, kind: "trabajo" },
    { id: "ac2", ts: now.getTime() - 21 * 60e3, texto: `Factura cobrada por Bizum`, kind: "pago" },
    { id: "ac3", ts: now.getTime() - 35 * 60e3, texto: `Presupuesto abierto por el cliente`, kind: "info" },
    { id: "ac4", ts: now.getTime() - 64 * 60e3, texto: `${techs[3].nombre} ha cerrado un parte con firma`, kind: "trabajo" },
  ];

  return {
    version: DATA_VERSION,
    sector: sectorId,
    semilla,
    hoy,
    techs,
    clients,
    installations,
    avisos,
    jobs,
    invoices,
    stock,
    vehicles,
    contracts,
    quotes,
    opportunities,
    expenses,
    absences,
    payslips,
    comunicados,
    timeEntries,
    incidencias,
    chats,
    notifs,
    activity,
    counters: { job: jobN, invoice: invN, quote: 154 },
    meId,
  };
}
