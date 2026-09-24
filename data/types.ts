import type { AvisoTipo, Canal, SectorId, Urgencia } from "./sectors";

export type JobStatus = "pendiente" | "asignado" | "en-camino" | "en-curso" | "finalizado" | "facturado";

export type Tech = {
  id: string;
  nombre: string;
  rol: string;
  color: string;
  telefono: string;
  zona: string;
  vehiculoId: string;
  estado: "fuera" | "trabajando" | "pausa";
  fichajeInicio?: number;
  pausaInicio?: number;
  pausaAcumMin: number;
  lat: number;
  lon: number;
};

export type Client = {
  id: string;
  nombre: string;
  tipo: string;
  municipio: string;
  direccion: string;
  contacto: string;
  telefono: string;
  email: string;
  cif: string;
  lat: number;
  lon: number;
  desde: string;
  centros: number;
  notas?: string;
  etiquetas: string[];
};

export type Installation = {
  id: string;
  clientId: string;
  nombre: string;
  codigo: string;
  marca: string;
  instalada: string;
  ultimaRevision: string;
  estado: "ok" | "revisar" | "averiada";
};

export type Linea = { speaker: "cliente" | "oficina"; texto: string; t: number };

export type Aviso = {
  id: string;
  canal: Canal;
  clientId?: string;
  contacto: string;
  telefono: string;
  recibido: number;
  duracionSeg?: number;
  tipo: AvisoTipo;
  urgencia: Urgencia;
  resumen: string;
  lineas: Linea[];
  estado: "nuevo" | "convertido" | "descartado";
  jobId?: string;
  servicio: number;
  instalacionNombre?: string;
  /** para la animación de llamada en directo */
  enDirecto?: boolean;
};

export type JobMaterial = { itemId: string; cantidad: number };

export type Job = {
  id: string;
  codigo: string;
  clientId: string;
  installationId?: string;
  titulo: string;
  servicio: number;
  estado: JobStatus;
  prioridad: Urgencia;
  techId?: string;
  fecha: string; // aaaa-mm-dd
  hora: string; // HH:MM
  duracionMin: number;
  importe: number;
  origenAvisoId?: string;
  checklistHecho?: boolean[];
  mediciones?: Record<string, number>;
  material?: JobMaterial[];
  fotos?: number;
  firmadoPor?: string;
  horasReales?: number;
  informe?: boolean;
  facturaId?: string;
  notasOficina?: string;
  inicio?: number;
  fin?: number;
  contratoId?: string;
};

export type InvoiceStatus = "borrador" | "emitida" | "cobrada" | "vencida";
export type InvoiceLine = { concepto: string; cantidad: number; precio: number };

export type Invoice = {
  id: string;
  numero: string;
  serie: "F" | "R" | "C";
  clientId: string;
  jobId?: string;
  contratoId?: string;
  fecha: string;
  vencimiento: string;
  lineas: InvoiceLine[];
  base: number;
  iva: number;
  total: number;
  estado: InvoiceStatus;
  verifactu?: { huella: string; registrada: number };
  enlacePago?: string;
  cobradaEn?: number;
  metodo?: "tarjeta" | "bizum" | "transferencia" | "remesa SEPA";
  recordatorios: number;
};

export type StockItem = {
  id: string;
  nombre: string;
  ref: string;
  unidad: string;
  precio: number;
  nave: number;
  minimo: number;
  furgonetas: Record<string, number>;
};

export type Vehicle = {
  id: string;
  matricula: string;
  modelo: string;
  techId: string;
  km: number;
  itv: string;
  seguro: string;
  revision: string;
  combustibleMes: number;
};

export type Contract = {
  id: string;
  clientId: string;
  nombre: string;
  periodicidad: "mensual" | "trimestral" | "anual";
  cuota: number;
  inicio: string;
  renovacion: string;
  respuestaHoras: number;
  visitasAnio: number;
  estado: "activo" | "pendiente-firma" | "por-renovar";
  firmado?: string;
};

export type Quote = {
  id: string;
  numero: string;
  clientId: string;
  titulo: string;
  importe: number;
  fecha: string;
  estado: "borrador" | "enviado" | "visto" | "aceptado" | "rechazado";
  vistoEn?: number;
};

export type Opportunity = {
  id: string;
  nombre: string;
  empresa: string;
  importe: number;
  etapa: "nuevo" | "contactado" | "presupuesto" | "negociacion" | "ganado" | "perdido";
  proximo: string;
  origen: string;
  motivoPerdida?: string;
};

export type Expense = {
  id: string;
  fecha: string;
  proveedor: string;
  categoria: string;
  base: number;
  iva: number;
  techId?: string;
  leido: boolean;
};

export type Absence = {
  id: string;
  techId: string;
  tipo: "vacaciones" | "asuntos propios" | "ausencia justificada";
  desde: string;
  hasta: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  solicitada: number;
};

export type Payslip = { id: string; techId: string; mes: string; subida: number; leida?: number };
export type Comunicado = { id: string; titulo: string; texto: string; fecha: number; leidos: string[] };
export type TimeEntry = { id: string; techId: string; fecha: string; entrada: string; salida: string; pausaMin: number; lat: number; lon: number };
export type Incidencia = { id: string; clientId: string; jobId?: string; titulo: string; tipo: "garantía" | "reclamación" | "retrabajo"; estado: "abierta" | "en curso" | "cerrada"; abierta: string };
export type ChatMsg = { id: string; jobId?: string; techId: string; from: "oficina" | "tecnico"; texto: string; ts: number };
export type Notif = { id: string; to: "panel" | "app"; titulo: string; texto: string; ts: number; leida: boolean; kind: "aviso" | "trabajo" | "factura" | "equipo" | "pago" | "info"; href?: string };
export type Activity = { id: string; ts: number; texto: string; kind: Notif["kind"] };

export type DemoData = {
  version: number;
  sector: SectorId;
  semilla: number;
  hoy: string;
  techs: Tech[];
  clients: Client[];
  installations: Installation[];
  avisos: Aviso[];
  jobs: Job[];
  invoices: Invoice[];
  stock: StockItem[];
  vehicles: Vehicle[];
  contracts: Contract[];
  quotes: Quote[];
  opportunities: Opportunity[];
  expenses: Expense[];
  absences: Absence[];
  payslips: Payslip[];
  comunicados: Comunicado[];
  timeEntries: TimeEntry[];
  incidencias: Incidencia[];
  chats: ChatMsg[];
  notifs: Notif[];
  activity: Activity[];
  counters: { job: number; invoice: number; quote: number };
  /** id del técnico que usa la app en la demo */
  meId: string;
  /** último cambio (para resaltar filas) */
  lastChange?: { ids: string[]; ts: number };
};
