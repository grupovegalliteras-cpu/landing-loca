/**
 * Catálogo de servicios de Nexo4Pymes: fuente de verdad del contenido.
 * `estado` indica si el módulo está listo hoy o se construye a medida.
 * Las etiquetas de estado se muestran en la demo solo con `?estado=1`.
 */

export type ModuleGroup = "captacion" | "clientes" | "operaciones" | "finanzas" | "equipo" | "datos";
export type ModuleStatus = "disponible" | "a-medida";

export type Modulo = {
  id: string;
  nombre: string;
  descripcion: string;
  grupo: ModuleGroup;
  estado: ModuleStatus;
  /** "todos" o una lista de ids de sector */
  sectores: "todos" | string[];
  icono: string;
  destacado?: boolean;
};

export const GRUPOS: Record<ModuleGroup, { nombre: string; lema: string }> = {
  captacion: { nombre: "Captación y atención", lema: "Que ningún aviso se quede en un papel." },
  clientes: { nombre: "Clientes y ventas", lema: "Todo lo de cada cliente, en una ficha." },
  operaciones: { nombre: "Operaciones y campo", lema: "Cada técnico sabe qué hacer, dónde y cómo." },
  finanzas: { nombre: "Facturación y finanzas", lema: "Del parte a la factura cobrada sin teclear dos veces." },
  equipo: { nombre: "Equipo y personas", lema: "Fichajes, vacaciones y documentos sin papeles." },
  datos: { nombre: "Datos, IA y automatización", lema: "Saber cómo va la empresa sin pedir un informe." },
};

export const MODULOS: Modulo[] = [
  // A. Captación y atención al cliente
  { id: "central-avisos", nombre: "Central Avisos", descripcion: "Llamadas grabadas y transcritas, WhatsApp, email y web en una sola bandeja. La IA clasifica tipo, urgencia y cliente, y crea la orden de trabajo en un clic.", grupo: "captacion", estado: "disponible", sectores: "todos", icono: "PhoneIncoming", destacado: true },
  { id: "asistente-atencion", nombre: "Asistente de atención con IA", descripcion: "Responde las preguntas frecuentes por WhatsApp o web a cualquier hora, recoge los datos del aviso y pasa a una persona cuando hace falta.", grupo: "captacion", estado: "disponible", sectores: "todos", icono: "MessagesSquare" },
  { id: "web-reservas", nombre: "Web y reservas online", descripcion: "Web corporativa, formulario de presupuesto y calendario de citas conectado con la planificación.", grupo: "captacion", estado: "disponible", sectores: "todos", icono: "Globe" },
  { id: "recordatorios", nombre: "Avisos automáticos al cliente", descripcion: "Confirmación de visita, aviso de «el técnico va de camino» y encuesta al terminar.", grupo: "captacion", estado: "disponible", sectores: "todos", icono: "BellRing" },
  { id: "resenas", nombre: "Reseñas en Google", descripcion: "Después de un servicio bien valorado, el cliente recibe una invitación para dejar su reseña.", grupo: "captacion", estado: "disponible", sectores: "todos", icono: "Star" },

  // B. Clientes y ventas
  { id: "clientes", nombre: "CRM de clientes", descripcion: "Ficha con contactos, direcciones, historial de trabajos, facturas, llamadas, documentos y notas.", grupo: "clientes", estado: "disponible", sectores: "todos", icono: "Users", destacado: true },
  { id: "instalaciones", nombre: "Instalaciones y equipos", descripcion: "Piscinas, máquinas, calderas o locales de cada cliente, con historial, fotos y código QR para identificarlos en campo.", grupo: "clientes", estado: "disponible", sectores: "todos", icono: "QrCode" },
  { id: "embudo", nombre: "Embudo comercial", descripcion: "Oportunidades en tablero, seguimientos programados y motivos de pérdida.", grupo: "clientes", estado: "disponible", sectores: "todos", icono: "Kanban" },
  { id: "presupuestos", nombre: "Presupuestos online", descripcion: "Plantillas y catálogo de precios, envío por email o WhatsApp, aviso al abrirlo y aceptación con firma en un clic.", grupo: "clientes", estado: "disponible", sectores: "todos", icono: "FileSignature" },
  { id: "contratos", nombre: "Contratos de mantenimiento", descripcion: "Preventivos recurrentes que generan solos las órdenes de trabajo, con tiempo de respuesta pactado, aviso de renovación y firma desde el móvil.", grupo: "clientes", estado: "disponible", sectores: "todos", icono: "ScrollText" },
  { id: "portal-cliente", nombre: "Portal del cliente", descripcion: "Tu cliente ve sus visitas, informes, facturas y contratos, y abre incidencias sin llamar.", grupo: "clientes", estado: "a-medida", sectores: "todos", icono: "LayoutPanelLeft" },
  { id: "multi-centro", nombre: "Multi-centro para cadenas", descripcion: "Un cliente con muchos centros (supermercados, hoteles, oficinas) y planificación por ruta entre ellos.", grupo: "clientes", estado: "a-medida", sectores: ["climatizacion", "limpieza", "mantenimiento", "plagas"], icono: "Building2" },

  // C. Operaciones y trabajo de campo
  { id: "planificacion", nombre: "Planificación", descripcion: "Calendario por técnico con arrastrar y soltar, vista semanal y diaria, y aviso de solapes.", grupo: "operaciones", estado: "disponible", sectores: "todos", icono: "CalendarRange", destacado: true },
  { id: "rutas", nombre: "Rutas optimizadas", descripcion: "Mapa con las paradas de cada técnico y la ruta más corta, con los kilómetros y el tiempo que ahorras.", grupo: "operaciones", estado: "disponible", sectores: "todos", icono: "Route", destacado: true },
  { id: "trabajos", nombre: "Órdenes de trabajo", descripcion: "Estados, prioridad, checklist por tipo de servicio, horas, material, fotos y firma.", grupo: "operaciones", estado: "disponible", sectores: "todos", icono: "ClipboardList", destacado: true },
  { id: "informes", nombre: "Informe de servicio automático", descripcion: "PDF con tu marca, fotos antes y después, mediciones y firma, enviado solo al cliente al terminar.", grupo: "operaciones", estado: "disponible", sectores: "todos", icono: "FileCheck2" },
  { id: "almacen", nombre: "Almacén y material", descripcion: "Stock por nave y por furgoneta, mínimos y alertas, descuento automático al cerrar el parte y coste por trabajo.", grupo: "operaciones", estado: "disponible", sectores: "todos", icono: "Package" },
  { id: "flota", nombre: "Flota de vehículos", descripcion: "ITV, seguros, revisiones, kilómetros, combustible y asignación a técnicos.", grupo: "operaciones", estado: "disponible", sectores: "todos", icono: "Truck" },
  { id: "incidencias", nombre: "Incidencias y garantías", descripcion: "Reclamaciones, retrabajos y seguimiento hasta el cierre.", grupo: "operaciones", estado: "disponible", sectores: "todos", icono: "LifeBuoy" },

  // D. Facturación y finanzas
  { id: "facturacion", nombre: "Facturación integrada con VeriFactu", descripcion: "Factura desde el parte de trabajo, con series, rectificativas y QR en la factura. Envío por email o WhatsApp.", grupo: "finanzas", estado: "disponible", sectores: "todos", icono: "Receipt", destacado: true },
  { id: "recurrente", nombre: "Facturación recurrente", descripcion: "Las cuotas de los contratos de mantenimiento se facturan solas: mensual, trimestral o anual.", grupo: "finanzas", estado: "disponible", sectores: "todos", icono: "Repeat" },
  { id: "cobros", nombre: "Cobros", descripcion: "Enlace de pago con tarjeta o Bizum, domiciliación bancaria con remesas SEPA y estado de cobro por factura.", grupo: "finanzas", estado: "disponible", sectores: "todos", icono: "CreditCard" },
  { id: "impagos", nombre: "Control de impagos", descripcion: "Recordatorios automáticos a los 7, 15 y 30 días, y panel de antigüedad de deuda.", grupo: "finanzas", estado: "disponible", sectores: "todos", icono: "AlarmClock" },
  { id: "gastos", nombre: "Gastos con foto", descripcion: "Foto del ticket o de la factura del proveedor, lectura automática y clasificación por categoría.", grupo: "finanzas", estado: "disponible", sectores: "todos", icono: "Camera" },
  { id: "contabilidad", nombre: "Contabilidad conectada", descripcion: "Ingresos y gastos, conciliación bancaria, IVA estimado del trimestre, previsión de tesorería y todo listo para tu gestoría.", grupo: "finanzas", estado: "disponible", sectores: "todos", icono: "Landmark" },
  { id: "rentabilidad", nombre: "Rentabilidad", descripcion: "Margen por cliente, por servicio, por técnico y por contrato.", grupo: "finanzas", estado: "disponible", sectores: "todos", icono: "TrendingUp" },

  // E. Equipo y recursos humanos
  { id: "fichaje", nombre: "Fichaje", descripcion: "Entrada, salida y pausas desde el móvil con ubicación, modo tablet para la oficina y registro de jornada exportable para inspección.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "Fingerprint", destacado: true },
  { id: "turnos", nombre: "Turnos y guardias", descripcion: "Cuadrante semanal visible en la app de cada trabajador.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "CalendarClock" },
  { id: "vacaciones", nombre: "Vacaciones y ausencias", descripcion: "Solicitud desde el móvil, aprobación desde la oficina y calendario del equipo.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "Palmtree" },
  { id: "horas-extra", nombre: "Horas extra", descripcion: "Calculadas a partir de los fichajes y listas para enviar a la gestoría.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "Timer" },
  { id: "nominas", nombre: "Nóminas y documentos", descripcion: "Subes el PDF que te pasa la gestoría y cada trabajador recibe solo la suya, con aviso y confirmación de lectura.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "FileText" },
  { id: "prevencion", nombre: "Prevención y formación", descripcion: "Entrega de equipos de protección con firma, cursos y certificados con fecha de caducidad y aviso.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "HardHat" },
  { id: "comunicados", nombre: "Comunicados internos", descripcion: "Mensajes a todo el equipo con confirmación de lectura.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "Megaphone" },
  { id: "chat", nombre: "Chat operario y oficina", descripcion: "Conversación asociada a cada trabajo, con fotos y ubicación.", grupo: "equipo", estado: "disponible", sectores: "todos", icono: "MessageCircle" },

  // F. Datos, IA y automatización
  { id: "direccion", nombre: "Panel de dirección", descripcion: "Facturación, cobros, trabajos, productividad y avisos en tiempo real.", grupo: "datos", estado: "disponible", sectores: "todos", icono: "LayoutDashboard", destacado: true },
  { id: "asistente-ia", nombre: "Asistente IA del panel", descripcion: "Pregunta como hablas: «¿cuánto le he facturado a Hotel Sa Roca este año?» y recibe la respuesta con enlace a los datos.", grupo: "datos", estado: "disponible", sectores: "todos", icono: "Sparkles", destacado: true },
  { id: "informes-automaticos", nombre: "Informes automáticos", descripcion: "Cada lunes, un resumen de la semana en el email del dueño.", grupo: "datos", estado: "disponible", sectores: "todos", icono: "Mail" },
  { id: "automatizaciones", nombre: "Automatizaciones a medida", descripcion: "Esas tareas repetitivas que hoy alguien hace a mano, dejan de hacerse a mano.", grupo: "datos", estado: "a-medida", sectores: "todos", icono: "Workflow" },
  { id: "conexiones", nombre: "Conexión con tus herramientas", descripcion: "Gestoría, banco, email, calendario y web conectados con el panel.", grupo: "datos", estado: "a-medida", sectores: "todos", icono: "Plug" },
  { id: "seguridad", nombre: "Seguridad y permisos", descripcion: "Roles de dueño, oficina, técnico y cliente. Cada operario ve solo lo suyo, registro de actividad y datos alojados en la UE.", grupo: "datos", estado: "disponible", sectores: "todos", icono: "ShieldCheck" },
];

export const MODULO_POR_ID = Object.fromEntries(MODULOS.map((m) => [m.id, m])) as Record<string, Modulo>;

export function modulosDeGrupo(g: ModuleGroup) {
  return MODULOS.filter((m) => m.grupo === g);
}
